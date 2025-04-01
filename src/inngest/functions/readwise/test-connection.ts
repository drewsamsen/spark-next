import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { throttledReadwiseAuthRequest } from "../../utils/readwise-api";

// Function to test Readwise connection (manually triggered only)
export const readwiseConnectionTestFn = inngest.createFunction(
  { id: "readwise-connection-test" },
  { event: "readwise/test-connection" },
  async ({ event, step, logger }) => {
    const { userId, apiKey } = event.data;
    
    // Use the built-in logger for operational logs
    logger.info("Testing Readwise connection", { userId });
    
    if (!userId || !apiKey) {
      logger.error("Missing user ID or API key");
      return markAsError({ 
        success: false, 
        error: "Missing user ID or API key"
      });
    }
    
    try {
      // Test the Readwise API connection
      const connectionResult = await step.run("test-readwise-connection", async () => {
        logger.info(`Testing Readwise connection for user ${userId}`);
        
        // Use throttled auth request
        const result = await throttledReadwiseAuthRequest(apiKey, logger);
        
        if (result.success) {
          logger.info(`Connection successful for user ${userId}`);
        } else {
          logger.warn(`Connection failed: ${result.error || 'Unknown error'}`);
        }
        
        return result;
      });
      
      // Update user settings to mark connection as valid/invalid
      if (connectionResult.success) {
        await step.run("update-connection-status", async () => {
          logger.info("Updating connection status in user settings");
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user-settings`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              integrations: {
                readwise: {
                  isConnected: true
                }
              }
            }),
          });
          
          if (!response.ok) {
            logger.error("Failed to update connection status");
            return { success: false };
          }
          
          return { success: true };
        });
      }
      
      logger.info("Connection test completed", { success: connectionResult.success });
      
      return markAsLastStep(connectionResult);
    } catch (error) {
      logger.error(`Error testing connection for user ${userId}:`, error);
      return markAsError({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
); 