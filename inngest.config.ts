import { Inngest } from "inngest";
import { serve } from "inngest/next";

// Define event types for better type safety
export type AppEvents = {
  "user/registered": {
    data: {
      userId: string;
      email: string;
      name?: string;
      timestamp: string;
    };
  };
  "inngest/send": {
    data: {
      message: string;
      metadata?: Record<string, any>;
    };
  };
  "readwise/fetch-books": {
    data: {
      userId: string;
      apiKey: string;
    };
  };
};

// Initialize Inngest with typed events
export const inngest = new Inngest({
  id: "newco",
  eventKey: "events",
  validateEvents: process.env.NODE_ENV === "development",
});

// Define event handlers
export const userRegisteredFn = inngest.createFunction(
  { id: "user-registered-handler" },
  { event: "user/registered" },
  async ({ event, step }) => {
    await step.run("Log registration", async () => {
      console.log(`New user registered: ${event.data.email}`);
    });

    // Example: Send welcome email
    await step.run("Send welcome email", async () => {
      // Add your email sending logic here
      console.log(`Sending welcome email to ${event.data.email}`);
    });
  },
);

export const messageHandlerFn = inngest.createFunction(
  { id: "message-handler" },
  { event: "inngest/send" },
  async ({ event, step }) => {
    await step.run("Process message", async () => {
      console.log(`Processing message: ${event.data.message}`);
      if (event.data.metadata) {
        console.log("Metadata:", event.data.metadata);
      }
    });
  },
);

// Readwise book count function
export const readwiseFetchBooksFn = inngest.createFunction(
  { id: "readwise-fetch-books" },
  { event: "readwise/fetch-books" },
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
      // Fetch book count from Readwise API
      const result = await step.run("fetch-books-from-readwise", async () => {
        console.log(`Fetching Readwise books for user ${userId}`);
        
        // We're just setting up the basics, we'll implement the actual API call later
        // when instructed to do so
        const readwiseUrl = "https://readwise.io/api/v2/books/";
        
        // Mock response for now
        const mockResponse = {
          count: 0, 
          success: false,
          message: "API call not implemented yet"
        };
        
        return mockResponse;
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

// Export the serve function for use in API routes
export const serveInngest = serve({
  client: inngest,
  functions: [userRegisteredFn, messageHandlerFn, readwiseFetchBooksFn],
});
