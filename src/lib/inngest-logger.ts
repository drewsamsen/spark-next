import { FunctionLogsService } from './function-logs-service';

/**
 * Wraps an Inngest function handler with logging functionality.
 * 
 * This is a higher-order function that logs function execution to the database.
 * Use it by wrapping your handler functions directly rather than the Inngest function object.
 */
export function withLogging(handler: Function): Function {
  return async (ctx: any) => {
    const { event, step, fn } = ctx || {};
    const functionName = fn?.name || 'unknown-function';
    const functionId = fn?.id || 'unknown-id';
    const userId = event?.data?.userId || event?.user?.id || null;
    
    // Create initial log entry
    const logId = await FunctionLogsService.logFunctionStart({
      function_name: functionName,
      function_id: functionId,
      user_id: userId,
      input_params: event?.data
    });
    
    try {
      // Call the original handler
      const result = await handler(ctx);
      
      // Log successful completion
      if (logId) {
        await FunctionLogsService.updateFunctionLog(logId, {
          status: 'completed',
          result_data: result
        });
      }
      
      return result;
    } catch (error) {
      // Log failure
      if (logId) {
        await FunctionLogsService.updateFunctionLog(logId, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
          error_stack: error instanceof Error ? error.stack : undefined
        });
      }
      
      // Re-throw the error so Inngest can handle it
      throw error;
    }
  };
} 