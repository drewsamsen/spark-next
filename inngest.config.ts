import { Inngest } from "inngest";
import { serve } from "inngest/next";

// Define event types for better type safety
export type AppEvents = {
  "readwise/count-books": {
    data: {
      userId: string;
      apiKey: string;
    };
  };
  "readwise/connection-test": {
    data: {
      timestamp: string;
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
  validateEvents: process.env.NODE_ENV === "development"
});

// Readwise book count function - counts total books, does not fetch full content
export const readwiseCountBooksFn = inngest.createFunction(
  { id: "readwise-count-books" },
  { event: "readwise/count-books" },
  async ({ event, step }) => {
    const { userId, apiKey } = event.data;
    
    if (!apiKey) {
      console.error("No Readwise API key provided");
      return { 
        success: false, 
        error: "No API key provided" 
      };
    }
    
    try {
      // Fetch all books from Readwise API with pagination to count them
      const result = await step.run("count-books-from-readwise", async () => {
        console.log(`Counting Readwise books for user ${userId}`);
        
        const readwiseUrl = "https://readwise.io/api/v2/books/";
        
        let nextUrl = readwiseUrl;
        let totalBooks = 0;
        let page = 1;
        
        // Process all pages of results
        while (nextUrl) {
          console.log(`Fetching page ${page} from ${nextUrl}`);
          
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
          
          console.log(`Page ${page}: Found ${booksOnPage} books. Total so far: ${totalBooks}`);
          
          // Check if there's another page
          nextUrl = data.next || null;
          page++;
          
          // Safety check to prevent infinite loops
          if (page > 100) {
            console.warn("Reached 100 pages - stopping to prevent potential infinite loop");
            break;
          }
        }
        
        console.log(`Finished counting. Total books: ${totalBooks}`);
        
        return {
          count: totalBooks, 
          success: true
        };
      });
      
      // Update user settings with the results via API call
      await step.run("update-user-settings", async () => {
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
          console.error("Failed to update user settings");
          return { success: false, error: "Failed to update settings" };
        }
        
        return { success: true };
      });
      
      return { 
        success: true, 
        bookCount: result.count
      };
    } catch (error) {
      console.error("Error in Readwise function:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
);

// Function to test Readwise connection and sync books for all users
export const readwiseConnectionTestFn = inngest.createFunction(
  { id: "readwise-connection-test" },
  { cron: "0 3 * * *" }, // Run at 3:00 AM UTC every day
  async ({ step }) => {
    // Get all users who have Readwise API keys configured
    const users = await step.run("get-users-with-readwise", async () => {
      try {
        // Import here to avoid Node.js protocol issues in client-side code
        const { createClient } = await import('@supabase/supabase-js');
        
        // Create a direct connection to Supabase
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
        
        // Query for users with Readwise API keys
        const { data, error } = await supabase
          .from('user_settings')
          .select('id, settings')
          .not('settings->integrations->readwise->apiKey', 'is', null);
        
        if (error) {
          console.error("Error fetching users with Readwise API keys:", error);
          return [];
        }
        
        // Filter and map to just the data we need
        return data
          .filter(user => 
            user.settings?.integrations?.readwise?.apiKey && 
            typeof user.settings.integrations.readwise.apiKey === 'string' &&
            user.settings.integrations.readwise.apiKey.length > 0
          )
          .map(user => ({
            userId: user.id,
            apiKey: user.settings.integrations.readwise.apiKey
          }));
      } catch (error) {
        console.error("Error in get-users-with-readwise:", error);
        return [];
      }
    });
    
    console.log(`Found ${users.length} users with Readwise integration`);
    
    // Process each user sequentially
    for (const [index, user] of users.entries()) {
      try {
        // Trigger Readwise count for this user
        await step.run(`test-connection-user-${index}`, async () => {
          console.log(`Testing Readwise connection for user ${user.userId} (${index + 1}/${users.length})`);
          
          await inngest.send({
            name: "readwise/count-books",
            data: {
              userId: user.userId,
              apiKey: user.apiKey
            }
          });
          
          // Add a delay between users to avoid hitting rate limits
          if (index < users.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
          }
          
          return { success: true, userId: user.userId };
        });
      } catch (error) {
        console.error(`Error testing connection for user ${user.userId}:`, error);
        // Continue with next user even if one fails
      }
    }
    
    return {
      success: true,
      usersProcessed: users.length
    };
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
