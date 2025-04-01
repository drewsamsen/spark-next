import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { createClient } from "@supabase/supabase-js";

// Function to migrate tags from array columns to the tags table
export const migrateHighlightTagsFn = inngest.createFunction(
  { id: "migrate-highlight-tags" },
  { event: "tags/migrate-highlight-tags" },
  async ({ event, step, logger }) => {
    const { userId } = event.data;

    logger.info("Starting to migrate highlight tags", { userId });

    if (!userId) {
      logger.error("Missing user ID");
      return markAsError({ 
        success: false, 
        error: "Missing user ID"
      });
    }

    // Initialize Supabase client
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
      // Step 1: Get all highlights with tags for this user
      const highlightsResult = await step.run("fetch-highlights-with-tags", async () => {
        logger.info("Fetching highlights with tags");
        
        const { data, error } = await supabase
          .from('highlights')
          .select('id, rw_tags')
          .eq('user_id', userId)
          .not('rw_tags', 'is', null)
          .not('rw_tags', 'eq', '[]');
          
        if (error) {
          logger.error("Error fetching highlights with tags:", error);
          throw error;
        }
        
        const highlightsWithTags = data?.filter(h => 
          Array.isArray(h.rw_tags) && h.rw_tags.length > 0
        ) || [];
        
        logger.info(`Found ${highlightsWithTags.length} highlights with tags`);
        
        return { 
          highlights: highlightsWithTags, 
          success: true 
        };
      });

      if (!highlightsResult.success || highlightsResult.highlights.length === 0) {
        logger.info("No highlights with tags found or error fetching highlights");
        return markAsLastStep({ 
          success: true, 
          migrated: 0,
          message: "No highlights with tags to migrate"
        });
      }

      // Step 2: Get existing tags for this user
      const tagsResult = await step.run("fetch-existing-tags", async () => {
        logger.info("Fetching existing tags");
        
        const { data, error } = await supabase
          .from('tags')
          .select('id, name')
          .eq('user_id', userId);
          
        if (error) {
          logger.error("Error fetching existing tags:", error);
          throw error;
        }
        
        logger.info(`Found ${data?.length || 0} existing tags`);
        
        // Create a map of tag names to IDs for quick lookup
        const tagMap = new Map();
        for (const tag of (data || [])) {
          tagMap.set(tag.name.toLowerCase(), tag.id);
        }
        
        return { 
          tagMap: Object.fromEntries(tagMap), 
          success: true 
        };
      });

      if (!tagsResult.success) {
        logger.error("Failed to fetch existing tags");
        return markAsError({ 
          success: false, 
          error: "Failed to fetch existing tags"
        });
      }

      // Reconstruct the tag map from the object
      const tagMap = new Map(Object.entries(tagsResult.tagMap));

      // Step 3: Process tags and insert new ones
      const processResult = await step.run("process-and-insert-tags", async () => {
        logger.info("Processing highlights and inserting new tags");
        
        // Collect all unique tag names across all highlights
        const allTagNames = new Set<string>();
        for (const highlight of highlightsResult.highlights) {
          for (const tag of highlight.rw_tags) {
            if (typeof tag === 'string' && tag.trim() !== '') {
              allTagNames.add(tag.trim().toLowerCase());
            }
          }
        }
        
        const uniqueTagNames = Array.from(allTagNames);
        logger.info(`Found ${uniqueTagNames.length} unique tag names`);
        
        // Insert any new tags that don't exist yet
        const tagsToInsert = [];
        for (const tagName of uniqueTagNames) {
          if (!tagMap.has(tagName)) {
            tagsToInsert.push({
              name: tagName,
              user_id: userId,
              source: 'readwise',
              created_at: new Date().toISOString()
            });
          }
        }
        
        if (tagsToInsert.length > 0) {
          logger.info(`Inserting ${tagsToInsert.length} new tags`);
          
          const { data: newTags, error: insertError } = await supabase
            .from('tags')
            .insert(tagsToInsert)
            .select('id, name');
            
          if (insertError) {
            logger.error("Error inserting new tags:", insertError);
            throw insertError;
          }
          
          // Add the new tags to our map
          for (const tag of (newTags || [])) {
            tagMap.set(tag.name.toLowerCase(), tag.id);
          }
          
          logger.info(`Successfully inserted ${newTags?.length || 0} new tags`);
        } else {
          logger.info("No new tags to insert");
        }
        
        return { 
          uniqueTagCount: uniqueTagNames.length,
          insertedTagCount: tagsToInsert.length,
          success: true 
        };
      });

      // Step 4: Create highlight-tag associations
      const associationResult = await step.run("create-highlight-tag-associations", async () => {
        logger.info("Creating highlight-tag associations");
        
        // Create the associations data to insert
        const associations = [];
        let totalAssociations = 0;
        
        for (const highlight of highlightsResult.highlights) {
          for (const tagText of highlight.rw_tags) {
            if (typeof tagText !== 'string' || tagText.trim() === '') continue;
            
            const normalizedTagName = tagText.trim().toLowerCase();
            const tagId = tagMap.get(normalizedTagName);
            
            if (tagId) {
              associations.push({
                highlight_id: highlight.id,
                tag_id: tagId,
                user_id: userId,
                source: 'readwise'
              });
              totalAssociations++;
            } else {
              logger.warn(`Tag ID not found for tag name: ${normalizedTagName}`);
            }
          }
        }
        
        logger.info(`Created ${associations.length} highlight-tag associations`);
        
        // Insert the associations in batches
        if (associations.length > 0) {
          const batchSize = 100;
          for (let i = 0; i < associations.length; i += batchSize) {
            const batch = associations.slice(i, i + batchSize);
            logger.info(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(associations.length/batchSize)}: ${batch.length} associations`);
            
            const { error: insertError } = await supabase
              .from('highlight_tags')
              .insert(batch)
              .select();
              
            if (insertError) {
              // Ignore constraint errors (duplicate associations)
              if (insertError.code === '23505') {
                logger.warn("Duplicate highlight-tag associations found, continuing...");
              } else {
                logger.error("Error inserting highlight-tag associations:", insertError);
                throw insertError;
              }
            }
          }
          
          logger.info(`Completed insertion of ${associations.length} highlight-tag associations`);
        } else {
          logger.info("No highlight-tag associations to insert");
        }
        
        return { 
          associationsCount: associations.length,
          success: true 
        };
      });

      // Log results and return
      logger.info("Tag migration completed successfully", {
        uniqueTags: processResult.uniqueTagCount,
        newTags: processResult.insertedTagCount,
        associations: associationResult.associationsCount
      });

      return markAsLastStep({
        success: true,
        migrated: associationResult.associationsCount,
        tagsCreated: processResult.insertedTagCount,
        uniqueTags: processResult.uniqueTagCount
      });
    } catch (error) {
      logger.error("Error in migrate highlight tags function:", error);
      return markAsError({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
); 