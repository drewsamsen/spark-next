import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { createClient } from "@supabase/supabase-js";
import { getRepositories } from "@/repositories";
import { Resource, ResourceType } from "@/lib/categorization/types";

// Define types for our function
interface HighlightResult {
  id: string;
  rw_text: string;
  book_id: string;
}

interface SelectHighlightsResult {
  highlights: HighlightResult[];
  success: boolean;
  error?: string;
}

interface TagCheckResult {
  tagExists: boolean;
  tagId?: string;
  success: boolean;
}

interface ActionData {
  actionType: string;
  tagName?: string;
  resource?: Resource;
  tagId?: string;
  categoryId?: string;
  categoryName?: string;
}

// Function to tag random highlights via a context job
export const tagRandomHighlightsFn = inngest.createFunction(
  { id: "tag-random-highlights" },
  { event: "jobs/tag-random-highlights" },
  async ({ event, step, logger }) => {
    const { userId } = event.data;

    logger.info("Starting tag random highlights job", { userId });

    if (!userId) {
      logger.error("Missing user ID");
      return markAsError({ 
        success: false, 
        error: "Missing user ID"
      });
    }

    // Initialize Supabase client for direct database access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("Missing Supabase configuration");
      return markAsError({ 
        success: false, 
        error: "Server configuration error"
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // Step 1: Select 3 random highlights for this user
      const highlightsResult = await step.run("select-random-highlights", async () => {
        logger.info("Selecting 3 random highlights");
        
        const { data, error } = await supabase
          .from('highlights')
          .select('id, rw_text, book_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100); // Get a sample of recent highlights
          
        if (error) {
          logger.error("Error fetching highlights:", error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          logger.warn("No highlights found for user");
          return { 
            highlights: [] as HighlightResult[], 
            success: false,
            error: "No highlights found for user"
          } as SelectHighlightsResult;
        }

        // Randomly select 3 highlights or fewer if less than 3 are available
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        const selectedHighlights = shuffled.slice(0, Math.min(3, shuffled.length));
        
        logger.info(`Selected ${selectedHighlights.length} random highlights`);
        
        return { 
          highlights: selectedHighlights as HighlightResult[], 
          success: true 
        } as SelectHighlightsResult;
      });

      if (!highlightsResult.success || highlightsResult.highlights.length === 0) {
        logger.error("Failed to select random highlights or no highlights available");
        return markAsError({ 
          success: false, 
          error: highlightsResult.error || "No highlights available"
        });
      }

      // Step 2: Check if the "job-test" tag already exists
      const tagCheckResult = await step.run("check-existing-tag", async () => {
        logger.info("Checking if job-test tag exists");
        
        const { data, error } = await supabase
          .from('tags')
          .select('id, name')
          .eq('user_id', userId)
          .eq('name', 'job-test')
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
          logger.error("Error checking for existing tag:", error);
          throw error;
        }
        
        return { 
          tagExists: !!data,
          tagId: data?.id,
          success: true 
        } as TagCheckResult;
      });

      if (!tagCheckResult.success) {
        logger.error("Failed to check for existing tag");
        return markAsError({ 
          success: false, 
          error: "Failed to check for existing tag"
        });
      }

      // Step 3: Create a context job for applying the tag
      const createJobResult = await step.run("create-context-job", async () => {
        logger.info("Creating context job for tagging highlights");
        
        const repos = getRepositories();
        
        // Build list of actions for this job
        const actions: ActionData[] = [];
        const selectedHighlights = highlightsResult.highlights;
        
        // If tag doesn't exist, add action to create it
        if (!tagCheckResult.tagExists) {
          actions.push({
            actionType: 'create_tag',
            tagName: 'job-test'
          });
        }
        
        // Add actions to tag each highlight
        for (const highlight of selectedHighlights) {
          if (!highlight || !highlight.id) continue;
          
          const resource: Resource = {
            id: highlight.id,
            type: 'highlight' as ResourceType,
            userId
          };
          
          actions.push({
            actionType: 'add_tag',
            resource,
            tagId: tagCheckResult.tagId,
            tagName: !tagCheckResult.tagId ? 'job-test' : undefined
          });
        }
        
        // Create the job - use 'system' source and ensure we're bypassing RLS with service role
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          { auth: { persistSession: false } }
        );

        const { data: jobData, error: jobError } = await supabaseAdmin
          .from('categorization_jobs')
          .insert({
            user_id: userId,
            name: "Random Highlight Tagging",
            source: "system",
            status: 'pending'
          })
          .select()
          .single();

        if (jobError) {
          logger.error("Error creating job:", jobError);
          throw new Error(`Error creating job: ${jobError.message}`);
        }

        // Use the job result directly
        const jobResult = jobData;
        
        // Create job actions
        for (const action of actions) {
          if (!action.resource) continue;
          
          const actionData: Record<string, any> = {
            job_id: jobResult.id,
            action_type: action.actionType,
            resource_type: action.resource.type,
            resource_id: action.resource.id
          };
          
          // Add optional parameters if they exist
          if (action.categoryId) actionData.category_id = action.categoryId;
          if (action.tagId) actionData.tag_id = action.tagId;
          if (action.categoryName) actionData.category_name = action.categoryName;
          if (action.tagName) actionData.tag_name = action.tagName;
          
          const { error: actionError } = await supabaseAdmin
            .from('categorization_job_actions')
            .insert(actionData)
            .select()
            .single();
          
          if (actionError) {
            logger.error("Error creating job action:", actionError);
            throw new Error(`Error creating job action: ${actionError.message}`);
          }
        }
        
        return { 
          jobId: jobResult.id,
          actionsCount: actions.length,
          success: true 
        };
      });

      if (!createJobResult.success) {
        logger.error("Failed to create context job");
        return markAsError({ 
          success: false, 
          error: "Failed to create context job"
        });
      }

      logger.info("Successfully created context job", {
        jobId: createJobResult.jobId,
        actionsCount: createJobResult.actionsCount,
        highlightsSelected: highlightsResult.highlights.length
      });

      return markAsLastStep({
        success: true,
        jobId: createJobResult.jobId,
        highlightsCount: highlightsResult.highlights.length,
        tagExists: tagCheckResult.tagExists,
        message: `Created context job to tag ${highlightsResult.highlights.length} random highlights with "job-test" tag`
      });
    } catch (error) {
      logger.error("Error in tag random highlights function:", error);
      return markAsError({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
); 