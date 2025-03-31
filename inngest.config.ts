import { Inngest } from "inngest";
import { serve } from "inngest/next";
import { databaseLoggerMiddleware } from "./src/lib/inngest-db-logger-middleware";
import { createClient } from "@supabase/supabase-js";

/**
 * IMPORTANT: Function Completion Convention
 * 
 * All Inngest functions MUST include `isLastStep: true` in their final return value.
 * This marker is used by our database logger middleware to accurately track when a
 * function has truly completed rather than just finished an intermediate step.
 * 
 * Example:
 * ```
 * return {
 *   success: true,
 *   // other data...
 *   isLastStep: true  // Required for proper logging
 * }
 * ```
 * 
 * Without this marker, functions with multiple steps may appear to complete prematurely
 * in logs and UI components.
 */

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
  "readwise/sync-books": {
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

interface BooksMapResult {
  booksMap: Map<number, { id: string, rwUpdated: Date }>;
  success: boolean;
}

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
        error: "No API key provided",
        isLastStep: true
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
      
      logger.info("Book count completed successfully", { count: result.count });
      
      return { 
        success: true, 
        bookCount: result.count,
        isLastStep: true
      };
    } catch (error) {
      logger.error("Error in Readwise function:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        isLastStep: true
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
        error: "Missing user ID or API key",
        isLastStep: true
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
              error: errorData.detail || "Invalid API key",
              isLastStep: true
            };
          }
        } catch (error) {
          logger.error(`Connection error for user ${userId}:`, error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : "Connection failed",
            isLastStep: true
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
      
      return {
        ...connectionResult, 
        isLastStep: true
      };
    } catch (error) {
      logger.error(`Error testing connection for user ${userId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        isLastStep: true
      };
    }
  }
);

// Function to import books from Readwise to Supabase
export const readwiseSyncBooksFn = inngest.createFunction(
  { id: "readwise-sync-books" },
  { event: "readwise/sync-books" },
  async ({ event, step, logger }) => {
    const { userId, apiKey } = event.data;
    
    logger.info("Starting Readwise book import", { userId });
    
    if (!userId || !apiKey) {
      logger.error("Missing user ID or API key");
      return { 
        success: false, 
        error: "Missing user ID or API key",
        readwiseBooks: 0,
        sparkBooks: 0,
        imported: 0,
        updated: 0,
        isLastStep: true
      };
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("Missing Supabase configuration");
      return { 
        success: false, 
        error: "Server configuration error",
        readwiseBooks: 0,
        sparkBooks: 0,
        imported: 0,
        updated: 0,
        isLastStep: true
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Step 1: Fetch all existing books for this user from Supabase (once)
      logger.info("Step 1: Fetching existing books");
      type BookInfo = { id: string, rwUpdated: Date };
      type BookMap = Map<number, BookInfo>;
      
      const fetchResult = await step.run("fetch-existing-books", async () => {
        logger.info(`Fetching existing books for user ${userId} from database`);
        
        const { data, error } = await supabase
          .from('books')
          .select('id, rw_id, rw_updated')
          .eq('user_id', userId);
          
        if (error) {
          logger.error("Error fetching existing books:", error);
          throw error;
        }
        
        // Instead of returning a Map directly, return the raw data
        // Maps don't serialize properly between Inngest steps
        logger.info(`Found ${data?.length || 0} existing books in database`);
        
        return {
          booksData: data || [],
          success: true
        };
      });
      
      if (!fetchResult.success) {
        logger.error("Failed to fetch existing books");
        return { 
          success: false, 
          error: "Failed to fetch existing books",
          readwiseBooks: 0,
          sparkBooks: 0,
          imported: 0,
          updated: 0,
          isLastStep: true
        };
      }
      
      // Track the number of books in Supabase
      const sparkBooksCount = fetchResult.booksData.length;
      logger.info(`Total books in Supabase (Spark): ${sparkBooksCount}`);
      
      // Construct the Map here after getting the raw data back
      logger.info("Step 2: Creating lookup map from existing books");
      const booksMap = new Map<number, BookInfo>();
      for (const book of fetchResult.booksData) {
        booksMap.set(Number(book.rw_id), {
          id: book.id,
          rwUpdated: new Date(book.rw_updated)
        });
      }
      
      logger.info(`Created lookup map with ${booksMap.size} books`);
      
      // Step 2: Import books from Readwise API with batch processing
      logger.info("Step 3: Starting to import books from Readwise");
      const importResult = await step.run("import-books-from-readwise", async () => {
        logger.info(`Importing Readwise books for user ${userId}`);
        
        const readwiseUrl = "https://readwise.io/api/v2/books/";
        
        let nextUrl = readwiseUrl;
        let booksToInsert = [];
        let booksToUpdate = [];
        let totalReadwiseBooks = 0;
        let page = 1;
        
        logger.info(`Making first request to Readwise API: ${readwiseUrl}`);
        // Process all pages of results
        while (nextUrl) {
          logger.info(`Fetching page ${page} from ${nextUrl}`);
          
          // Add a small delay to respect rate limits (20 requests per minute)
          if (page > 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
          }
          
          try {
            const response = await fetch(nextUrl, {
              method: "GET",
              headers: {
                "Authorization": `Token ${apiKey}`,
                "Content-Type": "application/json"
              }
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              logger.error(`Readwise API error (${response.status}): ${errorText}`);
              throw new Error(`Readwise API error (${response.status}): ${errorText}`);
            }
            
            const data = await response.json();
            const books = data.results || [];
            
            // Add the books from this page to the total count
            totalReadwiseBooks += books.length;
            logger.info(`Received ${books.length} books from Readwise API (total so far: ${totalReadwiseBooks})`);
            
            // Process all books on this page in memory
            for (const book of books) {
              // Log the book ID and type for debugging
              logger.info(`Processing Readwise book ${book.id} (${book.title}), ID type: ${typeof book.id}`);
              
              // Map Readwise book properties to Supabase table columns
              const bookData = {
                user_id: userId,
                rw_id: book.id,
                rw_title: book.title,
                rw_author: book.author,
                rw_category: book.category,
                rw_source: book.source,
                rw_num_highlights: book.num_highlights,
                rw_last_highlight_at: book.last_highlight_at,
                rw_updated: book.updated,
                rw_cover_image_url: book.cover_image_url,
                rw_highlights_url: book.highlights_url,
                rw_source_url: book.source_url,
                rw_asin: book.asin,
                rw_tags: book.tags || [],
                rw_document_note: book.document_note
              };
              
              // Convert ID to number for consistent lookup
              const bookId = Number(book.id);
              const existingBook = booksMap.get(bookId);
              
              if (!existingBook) {
                // New book, add to insert batch
                booksToInsert.push(bookData);
                logger.info(`Book ${book.id} (${book.title}) will be inserted`);
              } else {
                // Existing book, check if update needed
                const newUpdated = new Date(book.updated);
                
                if (newUpdated > existingBook.rwUpdated) {
                  // Book needs update
                  booksToUpdate.push({
                    ...bookData,
                    id: existingBook.id // Include id for the update operation
                  });
                  logger.info(`Book ${book.id} (${book.title}) will be updated`);
                } else {
                  logger.info(`Book ${book.id} (${book.title}) is up to date, no action needed`);
                }
              }
            }
            
            logger.info(`Page ${page}: Processed ${books.length} books. Cumulative totals - To insert: ${booksToInsert.length}, To update: ${booksToUpdate.length}`);
            
            // Check if there's another page
            nextUrl = data.next || null;
            page++;
            
            // Safety check to prevent infinite loops
            if (page > 100) {
              logger.warn("Reached 100 pages - stopping to prevent potential infinite loop");
              break;
            }
          } catch (error) {
            logger.error(`Error processing Readwise API page ${page}:`, error);
            throw error;
          }
        }
        
        logger.info(`Finished processing all books. Ready to insert: ${booksToInsert.length}, Ready to update: ${booksToUpdate.length}`);
        
        // Execute batch operations
        let insertedCount = 0;
        let updatedCount = 0;
        
        logger.info("Starting database operations for book insertion/updates");
        
        // Insert new books in batches of 100
        if (booksToInsert.length > 0) {
          logger.info(`Beginning insertion of ${booksToInsert.length} books`);
          // Process in smaller batches to avoid hitting size limits
          const batchSize = 100;
          for (let i = 0; i < booksToInsert.length; i += batchSize) {
            const batch = booksToInsert.slice(i, i + batchSize);
            logger.info(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(booksToInsert.length/batchSize)}: ${batch.length} books`);
            
            const { error: insertError } = await supabase
              .from('books')
              .insert(batch);
              
            if (insertError) {
              logger.error("Error inserting books batch:", insertError);
            } else {
              insertedCount += batch.length;
              logger.info(`Successfully inserted batch: ${batch.length} books`);
            }
          }
        } else {
          logger.info("No new books to insert");
        }
        
        // Update existing books in batches of 100
        if (booksToUpdate.length > 0) {
          logger.info(`Beginning update of ${booksToUpdate.length} books`);
          // Process in smaller batches
          const batchSize = 100;
          for (let i = 0; i < booksToUpdate.length; i += batchSize) {
            const batch = booksToUpdate.slice(i, i + batchSize);
            logger.info(`Updating batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(booksToUpdate.length/batchSize)}: ${batch.length} books`);
            
            // Update each book in the batch
            for (const book of batch) {
              const { id, ...updateData } = book;
              const { error: updateError } = await supabase
                .from('books')
                .update(updateData)
                .eq('id', id);
                
              if (updateError) {
                logger.error(`Error updating book ${book.rw_id}:`, updateError);
              } else {
                updatedCount++;
              }
            }
          }
        } else {
          logger.info("No books to update");
        }
        
        logger.info(`Completed database operations. Inserted: ${insertedCount}, Updated: ${updatedCount}`);
        
        return {
          imported: insertedCount,
          updated: updatedCount,
          readwiseBooks: totalReadwiseBooks,
          success: true
        };
      });
      
      // Update user settings with the sync time
      logger.info("Step 4: Updating user settings with sync timestamp");
      await step.run("update-last-synced", async () => {
        // First get current settings
        const { data: currentSettings, error: getError } = await supabase
          .from('user_settings')
          .select('integrations')
          .eq('user_id', userId)
          .single();
        
        if (getError) {
          logger.error("Failed to get current user settings", getError);
          return { success: false };
        }
        
        // Merge existing settings with new lastSynced timestamp
        const updatedSettings = {
          integrations: {
            ...(currentSettings?.integrations || {}),
            readwise: {
              ...(currentSettings?.integrations?.readwise || {}),
              lastSynced: new Date().toISOString()
            }
          }
        };
        
        // Update settings
        const { error } = await supabase
          .from('user_settings')
          .update(updatedSettings)
          .eq('user_id', userId);
          
        if (error) {
          logger.error("Failed to update last synced timestamp", error);
          return { success: false };
        }
        
        logger.info("Successfully updated user settings with sync timestamp");
        return { success: true };
      });
      
      logger.info("Book import completed successfully", {
        imported: importResult.imported,
        updated: importResult.updated,
        readwiseBooks: importResult.readwiseBooks,
        sparkBooks: sparkBooksCount
      });
      
      return { 
        success: true, 
        imported: importResult.imported,
        updated: importResult.updated,
        readwiseBooks: importResult.readwiseBooks,
        sparkBooks: sparkBooksCount,
        isLastStep: true
      };
    } catch (error) {
      logger.error(`Error importing books for user ${userId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        readwiseBooks: 0,
        sparkBooks: 0,
        imported: 0,
        updated: 0,
        isLastStep: true
      };
    }
  }
);

// Export the serve function for use in API routes
export const serveInngest = serve({
  client: inngest,
  functions: [
    readwiseCountBooksFn,
    readwiseConnectionTestFn,
    readwiseSyncBooksFn
  ],
});
