import { Inngest } from "inngest";
import { serve } from "inngest/next";
import { databaseLoggerMiddleware } from "./src/lib/inngest-db-logger-middleware";

// Define event types for better type safety
export type AppEvents = {
  "readwise/count-books": {
    data: {
      userId: string;
      apiKey: string;
    };
  };
  "readwise/test-connection": {
    data: {
      userId: string;
      apiKey: string;
    }
  };
};

// Initialize Inngest with typed events
export const inngest = new Inngest({
  id: "spark",
  eventKey: process.env.INNGEST_EVENT_KEY || "events",
  // Additional configuration for production environments
  ...(process.env.NODE_ENV === "production" && {
    signedFetches: true,
    signingKey: process.env.INNGEST_SIGNING_KEY
  }),
  // Enable validation in development
  validateEvents: process.env.NODE_ENV === "development",
  // Add our database logger middleware
  middleware: [databaseLoggerMiddleware]
});

// Readwise book count function - counts total books, does not fetch full content
export const readwiseCountBooksFn = inngest.createFunction(
  { id: "readwise-count-books" },
  { event: "readwise/count-books" },
  async ({ event, step, logger }) => {
    const { userId, apiKey } = event.data;
    
    // Use the built-in logger for operational logs
    logger.info("Starting Readwise book count", { userId });
    
    if (!apiKey) {
      logger.error("No Readwise API key provided");
      return { 
        success: false, 
        error: "No API key provided" 
      };
    }
    
    try {
      // Fetch all books from Readwise API with pagination to count them
      const result = await step.run("count-books-from-readwise", async () => {
        logger.info(`Counting Readwise books for user ${userId}`);
        
        const readwiseUrl = "https://readwise.io/api/v2/books/";
        
        let nextUrl = readwiseUrl;
        let totalBooks = 0;
        let page = 1;
        
        // Process all pages of results
        while (nextUrl) {
          logger.info(`Fetching page ${page} from ${nextUrl}`);
          
          // Add a small delay to respect rate limits (20 requests per minute)
          if (page > 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
          }
          
          const response = await fetch(nextUrl, {
            method: "GET",
            headers: {
              "Authorization": `Token ${apiKey}`,
              "Content-Type": "application/json"
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Readwise API error (${response.status}): ${errorText}`);
          }
          
          const data = await response.json();
          
          // Count books on this page
          const booksOnPage = data.results ? data.results.length : 0;
          totalBooks += booksOnPage;
          
          logger.info(`Page ${page}: Found ${booksOnPage} books. Total so far: ${totalBooks}`);
          
          // Check if there's another page
          nextUrl = data.next || null;
          page++;
          
          // Safety check to prevent infinite loops
          if (page > 100) {
            logger.warn("Reached 100 pages - stopping to prevent potential infinite loop");
            break;
          }
        }
        
        logger.info(`Finished counting. Total books: ${totalBooks}`);
        
        return {
          count: totalBooks, 
          success: true
        };
      });
      
      // Update user settings with the results via API call
      await step.run("update-user-settings", async () => {
        logger.info("Updating user settings with book count");
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/readwise`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            bookCount: result.count,
            syncTime: new Date().toISOString(),
          }),
        });
        
        if (!response.ok) {
          logger.error("Failed to update user settings");
          return { success: false, error: "Failed to update settings" };
        }
        
        return { success: true };
      });
      
      logger.info("Book count completed successfully", { count: result.count });
      
      return { 
        success: true, 
        bookCount: result.count
      };
    } catch (error) {
      logger.error("Error in Readwise function:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
);

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
      return { 
        success: false, 
        error: "Missing user ID or API key" 
      };
    }
    
    try {
      // Test the Readwise API connection
      const connectionResult = await step.run("test-readwise-connection", async () => {
        logger.info(`Testing Readwise connection for user ${userId}`);
        
        try {
          // Try to connect to Readwise API
          const response = await fetch('https://readwise.io/api/v2/auth/', {
            method: 'GET',
            headers: {
              'Authorization': `Token ${apiKey}`
            }
          });
          
          if (response.status === 204) {
            logger.info(`Connection successful for user ${userId}`);
            return { success: true };
          } else {
            const errorData = await response.json()
              .catch(() => ({ detail: "Invalid API key" }));
            
            logger.warn(`Connection failed: ${errorData.detail || 'Invalid API key'}`);
            
            return { 
              success: false, 
              error: errorData.detail || "Invalid API key" 
            };
          }
        } catch (error) {
          logger.error(`Connection error for user ${userId}:`, error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : "Connection failed" 
          };
        }
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
      
      return connectionResult;
    } catch (error) {
      logger.error(`Error testing connection for user ${userId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
);

// Export the serve function for use in API routes
export const serveInngest = serve({
  client: inngest,
  functions: [
    readwiseCountBooksFn,
    readwiseConnectionTestFn
  ],
});
