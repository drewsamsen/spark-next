import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { createClient } from "@supabase/supabase-js";

// Task configuration mapping
const TASK_CONFIG: Record<string, {
  eventName: string;
  getEventData: (userId: string, settings: any) => any;
  validateSettings: (settings: any) => boolean;
}> = {
  "airtable-import-sparks": {
    eventName: "airtable/import-sparks",
    getEventData: (userId, settings) => ({
      userId,
      apiKey: settings.integrations?.airtable?.apiKey,
      baseId: settings.integrations?.airtable?.baseId,
      tableId: settings.integrations?.airtable?.tableId
    }),
    validateSettings: (settings) => {
      const airtable = settings.integrations?.airtable;
      return !!(airtable?.apiKey && airtable?.baseId && airtable?.tableId);
    }
  },
  "readwise-books-import": {
    eventName: "readwise/sync-books",
    getEventData: (userId, settings) => ({
      userId,
      apiKey: settings.integrations?.readwise?.apiKey
    }),
    validateSettings: (settings) => !!settings.integrations?.readwise?.apiKey
  },
  "readwise-highlights-sync": {
    eventName: "readwise/sync-highlights",
    getEventData: (userId, settings) => ({
      userId,
      apiKey: settings.integrations?.readwise?.apiKey
    }),
    validateSettings: (settings) => !!settings.integrations?.readwise?.apiKey
  }
};

/**
 * Scheduled cron job to run scheduled tasks for all users.
 * 
 * SCHEDULE: Runs hourly at minute 0
 * 
 * PROCESS:
 * 1. Query all users with scheduled tasks configured
 * 2. For each user, check each enabled task
 * 3. Determine if the task is due based on frequency setting
 * 4. Trigger the appropriate Inngest event for eligible tasks
 * 
 * FREQUENCY OPTIONS:
 * - hourly: Run every hour
 * - daily: Run once per day (every 24 hours)
 * - weekly: Run once per week (every 7 days)
 * - monthly: Run once per month (every 30 days)
 * 
 * @returns Summary of triggered tasks
 */
export const scheduledTasksCronFn = inngest.createFunction(
  { 
    id: "scheduled-tasks-cron",
    // Run hourly at minute 0
    // Format: minute hour day month weekday
    // "0 * * * *" means: At minute 0 of every hour
  },
  { cron: "0 * * * *" },
  async ({ step, logger }) => {
    logger.info("Starting scheduled tasks check");
    
    // Initialize Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("Missing Supabase configuration");
      return markAsError({ 
        success: false, 
        error: "Server configuration error",
        triggeredTasks: 0
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Step 1: Get all users with scheduled tasks
      const usersResult = await step.run("get-users-with-scheduled-tasks", async () => {
        logger.info("Querying users with scheduled tasks");
        
        const { data: users, error } = await supabase
          .from('user_settings')
          .select('user_id, settings')
          .not('settings->scheduledTasks', 'is', null);
        
        if (error) {
          logger.error("Error querying user settings:", error);
          throw error;
        }
        
        if (!users || users.length === 0) {
          logger.info("No users with scheduled tasks configured");
          return { users: [] };
        }
        
        logger.info(`Found ${users.length} users with scheduled tasks configured`);
        
        return { users };
      });
      
      if (usersResult.users.length === 0) {
        logger.info("No users require scheduled tasks at this time");
        return markAsLastStep({
          success: true,
          triggeredTasks: 0,
          skippedTasks: 0,
          message: "No users with scheduled tasks"
        });
      }
      
      // Step 2: Check each user's tasks and trigger as needed
      const taskResults = await step.run("trigger-scheduled-tasks", async () => {
        const now = new Date();
        let triggeredCount = 0;
        let skippedCount = 0;
        const triggeredTasks: Array<{ userId: string; taskId: string }> = [];
        
        for (const user of usersResult.users) {
          try {
            const settings = user.settings as any;
            const scheduledTasks = settings?.scheduledTasks || {};
            
            // Process each scheduled task for this user
            for (const [taskId, taskSchedule] of Object.entries(scheduledTasks)) {
              const schedule = taskSchedule as any;
              
              // Skip if not enabled or frequency is 'off'
              if (!schedule.enabled || schedule.frequency === 'off') {
                continue;
              }
              
              // Check if we have configuration for this task
              const taskConfig = TASK_CONFIG[taskId];
              if (!taskConfig) {
                logger.warn(`No configuration found for task: ${taskId}`);
                continue;
              }
              
              // Validate that user has required settings for this task
              if (!taskConfig.validateSettings(settings)) {
                logger.debug(`Skipping task ${taskId} for user ${user.user_id}: missing required settings`);
                skippedCount++;
                continue;
              }
              
              // Check if task is due based on frequency
              let shouldRun = false;
              const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : null;
              
              if (!lastRun) {
                // Never run before, so run now
                shouldRun = true;
              } else {
                const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
                
                switch (schedule.frequency) {
                  case 'hourly':
                    // Run if at least 1 hour has passed
                    shouldRun = hoursSinceLastRun >= 1;
                    break;
                  case 'daily':
                    // Run if at least 23 hours have passed (allows for some timing flexibility)
                    shouldRun = hoursSinceLastRun >= 23;
                    break;
                  case 'weekly':
                    // Run if at least 7 days have passed
                    shouldRun = hoursSinceLastRun >= (7 * 24);
                    break;
                  case 'monthly':
                    // Run if at least 30 days have passed
                    shouldRun = hoursSinceLastRun >= (30 * 24);
                    break;
                  default:
                    logger.warn(`Unknown frequency: ${schedule.frequency} for task ${taskId}`);
                }
              }
              
              if (shouldRun) {
                try {
                  // Trigger the appropriate Inngest event
                  const eventData = taskConfig.getEventData(user.user_id, settings);
                  await inngest.send({
                    name: taskConfig.eventName as any,
                    data: eventData
                  });
                  
                  // Update the lastRun timestamp
                  const updatedScheduledTasks = {
                    ...scheduledTasks,
                    [taskId]: {
                      ...schedule,
                      lastRun: now.toISOString()
                    }
                  };
                  
                  const updatedSettings = {
                    ...settings,
                    scheduledTasks: updatedScheduledTasks
                  };
                  
                  await supabase
                    .from('user_settings')
                    .update({ settings: updatedSettings })
                    .eq('user_id', user.user_id);
                  
                  triggeredTasks.push({ userId: user.user_id, taskId });
                  triggeredCount++;
                  logger.info(`Triggered task ${taskId} for user ${user.user_id}`);
                } catch (error) {
                  logger.error(`Error triggering task ${taskId} for user ${user.user_id}:`, error);
                }
              } else {
                skippedCount++;
                logger.debug(`Skipped task ${taskId} for user ${user.user_id}: not due yet (last run: ${lastRun?.toISOString()})`);
              }
            }
          } catch (error) {
            logger.error(`Error processing tasks for user ${user.user_id}:`, error);
          }
        }
        
        return {
          triggeredCount,
          skippedCount,
          triggeredTasks
        };
      });
      
      logger.info("Scheduled tasks check completed", {
        totalUsers: usersResult.users.length,
        triggered: taskResults.triggeredCount,
        skipped: taskResults.skippedCount
      });
      
      return markAsLastStep({
        success: true,
        totalUsers: usersResult.users.length,
        triggeredTasks: taskResults.triggeredCount,
        skippedTasks: taskResults.skippedCount,
        triggeredTaskDetails: taskResults.triggeredTasks
      });
    } catch (error) {
      logger.error("Error in scheduled tasks cron:", error);
      return markAsError({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        triggeredTasks: 0
      });
    }
  }
);

