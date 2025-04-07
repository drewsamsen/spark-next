import { inngest } from "../../../inngest/client";
import { getRepositories, getServerRepositories } from "@/repositories";
import { Resource, ResourceType } from "@/lib/categorization/types";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { HighlightWithRelations } from "@/lib/types";

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

interface AutomationSuccessResult {
  automationId: string;
  actionsCount: number;
  success: true;
}

interface AutomationErrorResult {
  error: string;
  success: false;
}

type AutomationResult = AutomationSuccessResult | AutomationErrorResult;

// Use the JSONB format action data types
interface AutomationAction {
  action_data: CreateTagAction | AddTagAction;
}

interface CreateTagAction {
  action: 'create_tag';
  tag_name: string;
}

interface AddTagAction {
  action: 'add_tag';
  target: ResourceType;
  target_id: string;
  tag_id: string;
  tag_name?: string;
}

// Function to ensure type safety when accessing highlightsResult.error
function getErrorMessage(result: SelectHighlightsResult): string {
  if (!result.success) {
    return result.error || "Failed to select highlights";
  }
  
  if (result.highlights.length === 0) {
    return "No highlights found for this user";
  }
  
  return "Unknown error";
}

// Function to safely get the tag ID with fallback
function getTagId(result: TagCheckResult): string {
  return (result.tagExists && result.tagId) ? result.tagId : '';
}

export const tagRandomHighlights = inngest.createFunction(
  { id: "tag-random-highlights" },
  { event: "automations/tag-random-highlights" },
  async ({ event, step, logger }) => {
    const { userId } = event.data;

    try {
      if (!userId) {
        logger.error("Missing userId in event data");
        return markAsError({
          success: false,
          error: "Missing userId in event data"
        });
      }

      logger.info("Starting tag random highlights automation", { userId });

      // Step 1: Check if tag exists or create it
      const tagCheckResult = await step.run("check-tag-exists", async () => {
        logger.info("Checking if tag exists");
        const repos = getServerRepositories();
        
        const existingTag = await repos.categorization.findTagByName('automation-test', userId);
        if (existingTag.data) {
          return {
            tagExists: true,
            tagId: existingTag.data.id,
            success: true
          } as TagCheckResult;
        }
        
        return {
          tagExists: false,
          success: true
        } as TagCheckResult;
      });

      if (!tagCheckResult.success) {
        logger.error("Failed to check tag existence");
        return markAsError({ 
          success: false, 
          error: "Failed to check tag existence"
        });
      }

      // Step 2: Select random highlights - replaced RPC with repository method
      const highlightsResult = await step.run("select-random-highlights", async () => {
        logger.info("Selecting random highlights");
        
        try {
          const repos = getServerRepositories();
          // Use the repository method to get random highlights with explicit userId
          const randomHighlights = await repos.highlights.getRandomHighlights(5, userId);
          
          // Check if any highlights were found
          if (!randomHighlights || randomHighlights.length === 0) {
            logger.warn("No highlights found for user");
            return {
              highlights: [],
              success: false,
              error: "No highlights found for this user"
            } as SelectHighlightsResult;
          }
          
          // Map to the expected format
          const mappedHighlights = randomHighlights.map(highlight => ({
            id: highlight.id,
            rw_text: highlight.rw_text || '',
            book_id: highlight.book_id
          }));
          
          logger.info(`Selected ${mappedHighlights.length} random highlights`);
          
          return {
            highlights: mappedHighlights,
            success: true
          } as SelectHighlightsResult;
        } catch (error) {
          logger.error("Error selecting random highlights:", error);
          return {
            highlights: [] as HighlightResult[],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error selecting highlights'
          } as SelectHighlightsResult;
        }
      });

      if (!highlightsResult.success || highlightsResult.highlights.length === 0) {
        const errorMsg = getErrorMessage(highlightsResult);
        logger.error("Failed to select highlights or no highlights found");
        return markAsError({ 
          success: false, 
          error: errorMsg
        });
      }

      // Step 3: Create a context automation for applying the tag
      const createAutomationResult = await step.run("create-context-automation", async () => {
        logger.info("Creating context automation for tagging highlights");
        
        try {
          const repos = getServerRepositories();
          
          // Build list of actions for this automation
          const actions: AutomationAction[] = [];
          const selectedHighlights = highlightsResult.highlights;
          
          // If tag doesn't exist, add action to create it
          if (!tagCheckResult.tagExists) {
            actions.push({
              action_data: {
                action: 'create_tag',
                tag_name: 'automation-test'
              }
            });
          }
          
          // Add actions to tag each highlight
          for (const highlight of selectedHighlights) {
            if (!highlight || !highlight.id) continue;
            
            if (tagCheckResult.tagExists && tagCheckResult.tagId) {
              // If tag exists, use its ID
              actions.push({
                action_data: {
                  action: 'add_tag',
                  target: 'highlight',
                  target_id: highlight.id,
                  tag_id: tagCheckResult.tagId
                }
              });
            } else {
              // If tag doesn't exist yet, use its name instead
              // We still need to provide tag_id for type compatibility, but we'll use tag_name for processing
              actions.push({
                action_data: {
                  action: 'add_tag',
                  target: 'highlight',
                  target_id: highlight.id,
                  tag_id: '', // Empty string for compatibility
                  tag_name: 'automation-test'
                }
              });
            }
          }
          
          // Create the automation using the repository
          const automation = await repos.automations.createAutomation({
            userId,
            name: "Random Highlight Tagging",
            source: 'system'
          });
          
          // Create automation actions using the repository
          for (const action of actions) {
            await repos.automations.createAutomationAction({
              automationId: automation.id,
              action_data: action.action_data
            });
          }
          
          return { 
            automationId: automation.id,
            actionsCount: actions.length,
            success: true as const
          } satisfies AutomationSuccessResult;
        } catch (error) {
          logger.error("Error creating automation:", error);
          return { 
            success: false as const,
            error: error instanceof Error ? error.message : "Unknown error creating automation"
          } satisfies AutomationErrorResult;
        }
      });

      if (!createAutomationResult.success) {
        logger.error("Failed to create context automation");
        return markAsError({ 
          success: false, 
          error: createAutomationResult.error
        });
      }

      logger.info("Successfully created context automation", {
        automationId: createAutomationResult.automationId,
        actionsCount: createAutomationResult.actionsCount,
        highlightsSelected: highlightsResult.highlights.length
      });

      return markAsLastStep({
        success: true,
        automationId: createAutomationResult.automationId,
        highlightsCount: highlightsResult.highlights.length,
        tagExists: tagCheckResult.tagExists,
        message: `Created context automation to tag ${highlightsResult.highlights.length} random highlights with "automation-test" tag`
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