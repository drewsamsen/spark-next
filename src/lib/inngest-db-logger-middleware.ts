import { FunctionLogsService } from "./function-logs-service";
import { createServerClient } from "./supabase";

/**
 * Track function execution contexts by runId to ensure transformOutput can access
 * the same context used in beforeExecution
 */
const functionContexts = new Map<string, { 
  functionId: string;
  functionName: string;
  logId?: string;
  isCompleting?: boolean; // Flag to prevent double completion
}>();

/**
 * Debug logging to track function execution
 */
function debugLog(message: string, data?: any) {
  console.log(`[INNGEST LOG] ${message}`, data ? data : '');
}

/**
 * Middleware that logs Inngest function execution to the database
 * 
 * This middleware hooks into the Inngest function lifecycle to record execution
 * in our database, allowing users to see function execution history.
 */
export const databaseLoggerMiddleware = {
  name: "Database Logger",
  init: () => {
    return {
      onFunctionRun: (arg: any) => {
        // Extract function info from the argument
        const fn = arg.fn || {};
        const ctx = arg.ctx || {};
        
        // Extract function and event information
        const functionName = fn.name || 'unknown-function';
        // Important: Some Inngest functions use name as ID
        const functionId = fn.id || functionName; 
        const eventName = ctx.event?.name;
        const userId = ctx.event?.data?.userId || ctx.event?.user?.id;
        
        // Get Inngest's run ID
        const runId = ctx.runId || '';
        
        // Log all function details for debugging
        debugLog('FUNCTION RUN DETAILS', {
          functionName,
          functionId,
          eventName,
          userId,
          runId,
          fn
        });
        
        // Skip logging if we don't have a valid runId
        if (!runId) {
          debugLog('Skipping function logging: No run ID available');
          return {
            transformInput: () => ({}),
            beforeExecution: () => {}
          };
        }
        
        debugLog(`Function run started: ${functionName} (${functionId}), runId: ${runId}`);
        
        // Store function context for later use in transformOutput
        functionContexts.set(runId, {
          functionId,
          functionName,
          isCompleting: false
        });
        
        return {
          beforeExecution: async () => {
            try {
              // Check database FIRST to see if this run has already been logged
              const supabase = createServerClient();
              
              const { data: existingLog } = await supabase
                .from('function_logs')
                .select('id, status')
                .eq('run_id', runId)
                .maybeSingle();
              
              // If there's already a log for this run_id, save its ID and don't create a new one
              if (existingLog?.id) {
                const context = functionContexts.get(runId);
                if (context) {
                  context.logId = existingLog.id;
                  // If this log is already completed or failed, mark it as completing
                  if (existingLog.status === 'completed' || existingLog.status === 'failed') {
                    context.isCompleting = true;
                  }
                  functionContexts.set(runId, context);
                  debugLog(`Using existing log ${existingLog.id} for run ${runId}, status: ${existingLog.status}`);
                }
                return;
              }
              
              // No existing log, create a new one
              debugLog(`Creating new log for ${functionName} (${functionId}), runId: ${runId}`);
              const logId = await FunctionLogsService.logFunctionStart({
                function_name: functionName,
                function_id: functionId,
                user_id: userId,
                run_id: runId,
                input_params: {
                  event: ctx.event,
                  eventName
                }
              });
              
              if (logId) {
                // Save the logId for later use in transformOutput
                const context = functionContexts.get(runId);
                if (context) {
                  context.logId = logId;
                  functionContexts.set(runId, context);
                  debugLog(`Created new log ${logId} for run ${runId}`);
                }
              }
            } catch (error) {
              console.error("Error logging function start:", error);
            }
          },
          
          transformOutput: ({ result }: { result: any }) => {
            // Always log when transformOutput is called
            debugLog('transformOutput called', { 
              runId: runId, 
              result: result ? 'Present' : 'Missing'
            });
            
            // Get the function context from our cache
            const context = functionContexts.get(runId);
            debugLog(`Context for runId ${runId}:`, context);
            
            // Only update the log if we have a logId
            if (context?.logId) {
              // Check if this is an intermediate result or final result
              if (result && !context.isCompleting) {
                // Check if this is the final step using the isLastStep convention
                const isFinalResult = result.isLastStep === true || 
                                     (result.data && result.data.isLastStep === true);
                
                if (isFinalResult) {
                  // This is marked as the final result, mark the function as completed
                  context.isCompleting = true;
                  functionContexts.set(runId, context);
                  debugLog(`Processing final result for run ${runId} (marked with isLastStep)`);
                  updateLogStatus(context.logId, result);
                } else {
                  // This is an intermediate step result, just update the data
                  // but keep the function status as "started"
                  debugLog(`Processing intermediate result for run ${runId}`);
                  updateLogWithoutCompletingStatus(context.logId, result);
                  return result;
                }
              } else {
                // Update the log status (this is likely an error case)
                updateLogStatus(context.logId, result);
              }
            } else {
              debugLog(`No log ID found for run ${runId}`);
              
              // Try to find the log ID in database as fallback
              (async () => {
                try {
                  const supabase = createServerClient();
                  const { data: logEntry } = await supabase
                    .from('function_logs')
                    .select('id')
                    .eq('run_id', runId)
                    .maybeSingle();
                    
                  if (logEntry?.id) {
                    debugLog(`Found log ID ${logEntry.id} in database for run ${runId}`);
                    updateLogStatus(logEntry.id, result);
                  }
                } catch (err) {
                  console.error('Error finding log entry:', err);
                }
              })();
            }
            
            // Must return the original result
            return result;
          },
          
          // Clean up function-specific state when execution completes
          beforeResponse: async () => {
            debugLog(`Function run completed: ${functionName}, runId: ${runId}`);
            // We intentionally keep the context in the map to handle straggling callbacks
          }
        };
      }
    };
  }
};

/**
 * Helper function to update log with data without changing status
 */
async function updateLogWithoutCompletingStatus(logId: string, result: any) {
  try {
    // Make sure we have a logId before trying to update
    if (!logId) return;
    
    debugLog(`Updating log data for ${logId} without changing status`);
    
    // Update the result data while maintaining the 'started' status
    await FunctionLogsService.updateFunctionLog(logId, {
      status: 'started', // Keep the status as started
      result_data: result.data || result // Update the result data
    });
    
    debugLog(`Updated log ${logId} with data without changing status`);
  } catch (err) {
    console.error("Error updating function log data:", err);
  }
}

/**
 * Helper function to update log status
 */
async function updateLogStatus(logId: string, result: any) {
  try {
    // Make sure we have a logId before trying to update
    if (!logId) return;
    
    debugLog(`Updating log status for ${logId}`, { 
      hasError: !!result.error 
    });
    
    if (result.error) {
      // Log failure with error details
      await FunctionLogsService.updateFunctionLog(logId, {
        status: "failed",
        error_message: result.error instanceof Error ? result.error.message : String(result.error),
        error_stack: result.error instanceof Error ? result.error.stack : undefined,
        result_data: result.data || result
      });
      debugLog(`Updated log ${logId} as failed`);
    } else {
      // Log successful completion with result data
      await FunctionLogsService.updateFunctionLog(logId, {
        status: "completed",
        result_data: result.data || result
      });
      debugLog(`Updated log ${logId} as completed`);
    }
  } catch (err) {
    console.error("Error updating function log status:", err);
  }
} 