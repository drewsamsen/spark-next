import { Inngest } from "inngest";
import { serve } from "inngest/next";
import { databaseLoggerMiddleware } from "./src/lib/inngest-db-logger-middleware";
import { createClient } from "@supabase/supabase-js";

// Rate limit tracking for Readwise API
const readwiseRateLimit = {
  lastRequestTime: 0,
  requestCount: 0,
  // Default delay is based on endpoint type
  // Books/Highlights APIs: 20 req/min = 3000ms
  // Other endpoints: 240 req/min = 250ms
  defaultDelayMs: {
    list: 3000, // For book/highlight LIST endpoints: 20 req/min
    other: 250  // For other endpoints: 240 req/min
  },
  // Current delay (will be adjusted based on endpoint and responses)
  minDelayMs: 250
};

/**
 * Makes a throttled request to the Readwise API respecting rate limits
 * Automatically adjusts delay based on response headers or errors
 */
async function throttledReadwiseRequest(
  url: string, 
  apiKey: string, 
  logger: { info: (message: string, context?: any) => void; error: (message: string, context?: any) => void; }
): Promise<any> {
  // Determine endpoint type to apply proper rate limit
  const isListEndpoint = url.includes('/api/v2/books') || url.includes('/api/v2/highlights');
  const endpointType = isListEndpoint ? 'list' : 'other';
  
  // Set appropriate delay for this endpoint type if not already set
  if (readwiseRateLimit.minDelayMs < readwiseRateLimit.defaultDelayMs[endpointType]) {
    readwiseRateLimit.minDelayMs = readwiseRateLimit.defaultDelayMs[endpointType];
    logger.info(`Using ${endpointType} endpoint rate limit: ${readwiseRateLimit.minDelayMs}ms delay`);
  }
  
  // Calculate time since last request
  const now = Date.now();
  const timeSinceLastRequest = now - readwiseRateLimit.lastRequestTime;
  
  // If we need to wait to respect minimum delay
  if (timeSinceLastRequest < readwiseRateLimit.minDelayMs) {
    const waitTime = readwiseRateLimit.minDelayMs - timeSinceLastRequest;
    logger.info(`Throttling Readwise API request, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update tracking variables before request
  readwiseRateLimit.lastRequestTime = Date.now();
  readwiseRateLimit.requestCount++;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    // Check for rate limit headers and adjust our delay if needed
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    
    if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
      // If we're close to hitting the limit, increase the delay
      readwiseRateLimit.minDelayMs = Math.min(5000, readwiseRateLimit.minDelayMs * 2);
      logger.info(`Rate limit getting low (${rateLimitRemaining} remaining), increasing delay to ${readwiseRateLimit.minDelayMs}ms`);
    }
    
    if (!response.ok) {
      // If we get a rate limit error (429), respect the Retry-After header
      if (response.status === 429) {
        // Check for Retry-After header as recommended by Readwise API docs
        const retryAfter = response.headers.get('Retry-After');
        let waitSeconds = 10; // Default wait if no header
        
        if (retryAfter) {
          waitSeconds = parseInt(retryAfter);
          logger.info(`Received Retry-After header: ${waitSeconds} seconds`);
        }
        
        // Convert to milliseconds and add buffer
        const waitTime = (waitSeconds * 1000) + 500;
        
        // Update our delay for future requests
        readwiseRateLimit.minDelayMs = Math.max(readwiseRateLimit.minDelayMs, 
                                               Math.min(5000, readwiseRateLimit.defaultDelayMs[endpointType] * 2));
        
        logger.error(`Hit Readwise rate limit, waiting ${waitTime}ms before retry`);
        
        // Wait the specified time before retrying
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Try again with recursion
        return throttledReadwiseRequest(url, apiKey, logger);
      }
      
      const errorText = await response.text();
      throw new Error(`Readwise API error (${response.status}): ${errorText}`);
    }
    
    // If we've made 20+ successful requests and haven't hit limits, we can cautiously reduce delay
    // but never go below the default for this endpoint type
    if (readwiseRateLimit.requestCount > 20 && readwiseRateLimit.minDelayMs > readwiseRateLimit.defaultDelayMs[endpointType]) {
      readwiseRateLimit.minDelayMs = Math.max(
        readwiseRateLimit.defaultDelayMs[endpointType], 
        readwiseRateLimit.minDelayMs * 0.8
      );
      readwiseRateLimit.requestCount = 0;
      logger.info(`Adjusting Readwise API delay to ${readwiseRateLimit.minDelayMs}ms`);
    }
    
    return await response.json();
  } catch (error) {
    // For network errors, increase delay as a precaution
    if (!(error instanceof Error && error.message.includes('Readwise API error'))) {
      readwiseRateLimit.minDelayMs = Math.min(5000, readwiseRateLimit.minDelayMs * 2);
      logger.error(`Network error with Readwise API, increasing delay to ${readwiseRateLimit.minDelayMs}ms`);
    }
    throw error;
  }
}

/**
 * Makes a throttled auth request to the Readwise API respecting rate limits
 */
async function throttledReadwiseAuthRequest(
  apiKey: string, 
  logger: { info: (message: string, context?: any) => void; error: (message: string, context?: any) => void; }
): Promise<{ success: boolean, error?: string }> {
  // Auth endpoint uses the standard rate limit
  if (readwiseRateLimit.minDelayMs < readwiseRateLimit.defaultDelayMs.other) {
    readwiseRateLimit.minDelayMs = readwiseRateLimit.defaultDelayMs.other;
  }
  
  // Calculate time since last request
  const now = Date.now();
  const timeSinceLastRequest = now - readwiseRateLimit.lastRequestTime;
  
  // If we need to wait to respect minimum delay
  if (timeSinceLastRequest < readwiseRateLimit.minDelayMs) {
    const waitTime = readwiseRateLimit.minDelayMs - timeSinceLastRequest;
    logger.info(`Throttling Readwise API request, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update tracking variables before request
  readwiseRateLimit.lastRequestTime = Date.now();
  readwiseRateLimit.requestCount++;
  
  try {
    const response = await fetch('https://readwise.io/api/v2/auth/', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });
    
    // If we get a rate limit error (429), respect the Retry-After header
    if (response.status === 429) {
      // Check for Retry-After header as recommended by Readwise API docs
      const retryAfter = response.headers.get('Retry-After');
      let waitSeconds = 10; // Default wait if no header
      
      if (retryAfter) {
        waitSeconds = parseInt(retryAfter);
        logger.info(`Received Retry-After header: ${waitSeconds} seconds`);
      }
      
      // Convert to milliseconds and add buffer
      const waitTime = (waitSeconds * 1000) + 500;
      
      // Update our delay for future requests
      readwiseRateLimit.minDelayMs = Math.max(readwiseRateLimit.minDelayMs, 
                                           Math.min(5000, readwiseRateLimit.defaultDelayMs.other * 2));
                                           
      logger.error(`Hit Readwise rate limit, waiting ${waitTime}ms before retry`);
      
      // Wait the specified time before retrying
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Try again with recursion
      return throttledReadwiseAuthRequest(apiKey, logger);
    }
    
    if (response.status === 204) {
      return { success: true };
    } else {
      const errorData = await response.json()
        .catch(() => ({ detail: "Invalid API key" }));
      return { success: false, error: errorData.detail || "Invalid API key" };
    }
  } catch (error) {
    // For network errors, increase delay as a precaution
    readwiseRateLimit.minDelayMs = Math.min(5000, readwiseRateLimit.minDelayMs * 2);
    logger.error(`Network error with Readwise API, increasing delay to ${readwiseRateLimit.minDelayMs}ms`);
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Connection failed"
    };
  }
}

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
  "readwise/sync-highlights": {
    data: {
      userId: string;
      apiKey: string;
    }
  };
  "tags/migrate-highlight-tags": {
    data: {
      userId: string;
    }
  };
  "airtable/import-data": {
    data: {
      userId: string;
      apiKey: string;
      baseId: string;
      tableId: string;
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
          
          try {
            // Use throttled request function instead of direct fetch
            const data = await throttledReadwiseRequest(nextUrl, apiKey, logger);
            
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
          } catch (error) {
            logger.error(`Error processing Readwise API page ${page}:`, error);
            throw error;
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
          
          try {
            // Use throttled request function instead of direct fetch
            const data = await throttledReadwiseRequest(nextUrl, apiKey, logger);
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

// Function to import highlights from Readwise to Supabase
export const readwiseSyncHighlightsFn = inngest.createFunction(
  { id: "readwise-sync-highlights" },
  { event: "readwise/sync-highlights" },
  async ({ event, step, logger }) => {
    const { userId, apiKey } = event.data;
    
    logger.info("Starting Readwise highlights sync", { userId });
    
    if (!userId || !apiKey) {
      logger.error("Missing user ID or API key");
      return { 
        success: false, 
        error: "Missing user ID or API key",
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
        isLastStep: true
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Step 1: Fetch books with highlight counts and determine which ones need syncing
      const bookResult = await step.run("fetch-books-to-sync", async () => {
        logger.info("Step 1: Fetching books to sync highlights for");
        
        // First get all books
        const { data: books, error } = await supabase
          .from('books')
          .select('id, rw_id, rw_title, rw_num_highlights')
          .eq('user_id', userId)
          .order('rw_title', { ascending: true });
          
        if (error) {
          logger.error("Error fetching books:", error);
          throw error;
        }
        
        logger.info(`Found ${books?.length || 0} books to check for highlights`);
        
        // For each book, check how many highlights we already have
        const booksToSync = [];
        
        for (const book of books || []) {
          // Skip books without rw_num_highlights
          if (!book.rw_num_highlights) {
            logger.info(`Book ${book.rw_title} has no Readwise highlight count, skipping`);
            continue;
          }
          
          // Count existing highlights for this book
          const { count, error: countError } = await supabase
            .from('highlights')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('book_id', book.id);
            
          if (countError) {
            logger.error(`Error counting highlights for book ${book.id}:`, countError);
            continue;
          }
          
          const existingCount = count || 0;
          
          // Compare counts to determine if syncing is needed
          if (existingCount < book.rw_num_highlights) {
            logger.info(`Book "${book.rw_title}" needs syncing: has ${existingCount}/${book.rw_num_highlights} highlights`);
            booksToSync.push({
              ...book,
              existingHighlightsCount: existingCount
            });
          } else {
            logger.info(`Book "${book.rw_title}" already has all highlights (${existingCount}/${book.rw_num_highlights}), skipping`);
          }
        }
        
        logger.info(`Identified ${booksToSync.length} books that need highlight syncing`);
        return { books: booksToSync, success: true };
      });
      
      if (!bookResult.success || bookResult.books.length === 0) {
        logger.info("No books found that need highlight syncing");
        return { 
          success: true, 
          message: "No books need highlights synced",
          booksProcessed: 0,
          isLastStep: true
        };
      }

      // Track overall sync statistics - these will be calculated from the results after processing
      let totalReadwiseHighlights = 0;         // Total highlights in Readwise across all books
      let totalExistingHighlights = 0;         // Highlights that were already in Supabase
      let totalNewHighlightsInserted = 0;      // Highlights newly inserted in this sync
      let totalHighlightsUpdated = 0;          // Highlights updated in this sync
      
      // Step 2: Process each book's highlights
      const syncResults = await step.run("sync-book-highlights", async () => {
        const results = [];
        
        // Process each book one by one
        for (const book of bookResult.books) {
          logger.info(`Processing highlights for book: ${book.rw_title} (ID: ${book.id}, Readwise ID: ${book.rw_id})`);
          
          // Step 2a: Get existing highlights for this book from Supabase
          const { data: existingHighlights, error: highlightsError } = await supabase
            .from('highlights')
            .select('id, rw_id, rw_updated')
            .eq('user_id', userId)
            .eq('book_id', book.id);
            
          if (highlightsError) {
            logger.error(`Error fetching existing highlights for book ${book.id}:`, highlightsError);
            results.push({
              bookId: book.id,
              rwBookId: book.rw_id,
              title: book.rw_title,
              success: false,
              error: highlightsError.message
            });
            continue; // Skip to the next book
          }
          
          const existingHighlightsCount = existingHighlights?.length || 0;
          
          logger.info(`Found ${existingHighlightsCount} existing highlights in Supabase for book ${book.rw_title}`);
          
          // Create a map of existing highlights for faster lookups
          const highlightsMap = new Map();
          existingHighlights?.forEach(highlight => {
            highlightsMap.set(Number(highlight.rw_id), {
              id: highlight.id,
              rwUpdated: new Date(highlight.rw_updated || 0)
            });
          });
          
          // We already checked that this book needs syncing in the previous step, so proceed directly
          // Step 2b: Get highlights from Readwise API
          logger.info(`Fetching highlights from Readwise API for book ${book.rw_title} (Readwise ID: ${book.rw_id})`);
          
          let nextUrl = `https://readwise.io/api/v2/highlights/?book_id=${book.rw_id}&page_size=1000`;
          let highlightsToInsert = [];
          let highlightsToUpdate = [];
          let readwiseHighlightsCount = 0;
          let page = 1;
          
          // Process all pages of highlights for this book
          while (nextUrl) {
            logger.info(`Fetching highlights page ${page} from ${nextUrl}`);
            
            try {
              // Use throttled request function instead of direct fetch
              const data = await throttledReadwiseRequest(nextUrl, apiKey, logger);
              const highlights = data.results || [];
              
              // Add the highlights from this page to the total count
              readwiseHighlightsCount += highlights.length;
              
              logger.info(`Received ${highlights.length} highlights from Readwise API for book ${book.rw_title} (total so far: ${readwiseHighlightsCount})`);
              
              // Process each highlight
              for (const highlight of highlights) {
                // Map Readwise highlight properties to Supabase table columns
                const highlightData = {
                  user_id: userId,
                  book_id: book.id,
                  rw_id: highlight.id,
                  rw_text: highlight.text,
                  rw_note: highlight.note,
                  rw_location: highlight.location,
                  rw_location_type: highlight.location_type,
                  rw_highlighted_at: highlight.highlighted_at,
                  rw_url: highlight.url,
                  rw_color: highlight.color,
                  rw_updated: highlight.updated,
                  rw_book_id: highlight.book_id,
                  rw_tags: highlight.tags && highlight.tags.length > 0 ? highlight.tags : null
                };
                
                // Check if highlight already exists
                const existingHighlight = highlightsMap.get(Number(highlight.id));
                
                if (!existingHighlight) {
                  // New highlight, add to insert batch
                  highlightsToInsert.push(highlightData);
                } else {
                  // Existing highlight, check if update needed
                  const newUpdated = new Date(highlight.updated);
                  
                  if (newUpdated > existingHighlight.rwUpdated) {
                    // Highlight needs update
                    highlightsToUpdate.push({
                      ...highlightData,
                      id: existingHighlight.id
                    });
                  }
                }
              }
              
              // Check if there's another page
              nextUrl = data.next || null;
              page++;
              
              // Safety check to prevent infinite loops
              if (page > 50) {
                logger.warn(`Reached 50 pages for book ${book.rw_title} - stopping to prevent potential infinite loop`);
                break;
              }
            } catch (error) {
              logger.error(`Error processing Readwise API page ${page} for book ${book.rw_title}:`, error);
              throw error;
            }
          }
          
          logger.info(`Finished processing all highlights for book ${book.rw_title}. Ready to insert: ${highlightsToInsert.length}, Ready to update: ${highlightsToUpdate.length}`);
          
          // Step 2c: Insert and update highlights in batches
          let insertedCount = 0;
          let updatedCount = 0;
          
          // Insert new highlights in batches
          if (highlightsToInsert.length > 0) {
            logger.info(`Beginning insertion of ${highlightsToInsert.length} highlights for book ${book.rw_title}`);
            
            const batchSize = 100;
            for (let i = 0; i < highlightsToInsert.length; i += batchSize) {
              const batch = highlightsToInsert.slice(i, i + batchSize);
              logger.info(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(highlightsToInsert.length/batchSize)}: ${batch.length} highlights`);
              
              const { error: insertError } = await supabase
                .from('highlights')
                .insert(batch);
                
              if (insertError) {
                logger.error(`Error inserting highlights batch for book ${book.rw_title}:`, insertError);
              } else {
                insertedCount += batch.length;
                logger.info(`Successfully inserted batch: ${batch.length} highlights`);
              }
            }
          }
          
          // Update existing highlights
          if (highlightsToUpdate.length > 0) {
            logger.info(`Beginning update of ${highlightsToUpdate.length} highlights for book ${book.rw_title}`);
            
            const batchSize = 100;
            for (let i = 0; i < highlightsToUpdate.length; i += batchSize) {
              const batch = highlightsToUpdate.slice(i, i + batchSize);
              logger.info(`Updating batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(highlightsToUpdate.length/batchSize)}: ${batch.length} highlights`);
              
              for (const highlight of batch) {
                const { id, ...updateData } = highlight;
                const { error: updateError } = await supabase
                  .from('highlights')
                  .update(updateData)
                  .eq('id', id);
                  
                if (updateError) {
                  logger.error(`Error updating highlight ${highlight.rw_id}:`, updateError);
                } else {
                  updatedCount++;
                }
              }
            }
          }
          
          logger.info(`Completed database operations for book ${book.rw_title}. Inserted: ${insertedCount}, Updated: ${updatedCount}`);
          
          // Add results for this book
          results.push({
            bookId: book.id,
            rwBookId: book.rw_id,
            title: book.rw_title,
            success: true,
            existing: existingHighlightsCount,
            fromReadwise: readwiseHighlightsCount,
            expected: book.rw_num_highlights,
            inserted: insertedCount,
            updated: updatedCount
          });
        }
        
        return results;
      });
      
      // Calculate totals from the results
      syncResults.forEach(result => {
        if (result.success) {
          if ('expected' in result) totalReadwiseHighlights += result.expected || 0;
          if ('existing' in result) totalExistingHighlights += result.existing || 0;
          if ('inserted' in result) totalNewHighlightsInserted += result.inserted || 0;
          if ('updated' in result) totalHighlightsUpdated += result.updated || 0;
        }
      });
      
      logger.info("Calculated totals from results", {
        totalReadwiseHighlights,
        totalExistingHighlights,
        totalNewHighlightsInserted,
        totalHighlightsUpdated
      });
      
      // Step 3: Update user settings with the sync time
      await step.run("update-last-synced", async () => {
        logger.info("Updating user settings with highlights sync timestamp");
        
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
        
        // Merge existing settings with new highlightsSynced timestamp
        const updatedSettings = {
          integrations: {
            ...(currentSettings?.integrations || {}),
            readwise: {
              ...(currentSettings?.integrations?.readwise || {}),
              highlightsSynced: new Date().toISOString()
            }
          }
        };
        
        // Update settings
        const { error } = await supabase
          .from('user_settings')
          .update(updatedSettings)
          .eq('user_id', userId);
          
        if (error) {
          logger.error("Failed to update highlights synced timestamp", error);
          return { success: false };
        }
        
        logger.info("Successfully updated user settings with highlights sync timestamp");
        return { success: true };
      });
      
      logger.info("Highlights sync completed successfully", {
        booksProcessed: bookResult.books.length,
        totalReadwiseHighlights,
        totalExistingHighlights,
        totalNewHighlightsInserted,
        totalHighlightsUpdated
      });
      
      return { 
        success: true, 
        booksProcessed: bookResult.books.length,
        totalReadwiseHighlights,
        totalExistingHighlights,
        totalNewHighlightsInserted,
        totalHighlightsUpdated,
        bookResults: syncResults,
        isLastStep: true
      };
    } catch (error: any) {
      logger.error("Error in Readwise highlights sync:", error);
      return { 
        success: false, 
        error: error.message || "Unknown error during highlights sync",
        isLastStep: true
      };
    }
  }
);

// Function to migrate rw_tags from highlights table to proper tags
export const migrateHighlightTagsFn = inngest.createFunction(
  { id: "migrate-highlight-tags" },
  { event: "tags/migrate-highlight-tags" },
  async ({ event, step, logger }) => {
    const { userId } = event.data;
    
    logger.info("Starting highlight tags migration", { userId });
    
    if (!userId) {
      logger.error("No user ID provided");
      return { 
        success: false, 
        error: "No user ID provided",
        migrated: 0,
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
        migrated: 0,
        isLastStep: true
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // First, check for existing migrations to avoid duplication
      const { data: existingJobs, error: jobError } = await step.run("check-existing-jobs", async () => {
        logger.info("Checking for existing migration jobs");
        
        const { data, error } = await supabase
          .from('categorization_jobs')
          .select('id')
          .eq('user_id', userId)
          .eq('name', "Migrate highlight rw_tags to proper tags")
          .eq('source', "system")
          .eq('status', 'approved');
          
        if (error) {
          logger.error("Error checking existing jobs:", error);
          throw error;
        }
        
        return { data, error };
      });
      
      if (jobError) {
        throw jobError;
      }
      
      // If we already have an approved migration job, only process highlights added since then
      let additionalQuery = '';
      if (existingJobs && existingJobs.length > 0) {
        logger.info(`Found ${existingJobs.length} existing approved migration jobs`);
        
        // We'll still run the migration but focus on highlights that:
        // 1. Were added after the most recent migration, or
        // 2. Have no tags in the highlight_tags junction table
        additionalQuery = `
          AND (
            h.id NOT IN (
              SELECT highlight_id FROM highlight_tags
            )
          )
        `;
        
        logger.info("Will only process highlights without any tags");
      }
      
      // Fetch all highlights with rw_tags that need processing
      const { data: highlights, error: fetchError } = await step.run("fetch-highlights-with-tags", async () => {
        logger.info("Fetching highlights with rw_tags that need processing");
        
        // Using standard Supabase queries instead of raw SQL
        let query = supabase
          .from('highlights')
          .select('id, rw_tags')
          .eq('user_id', userId)
          .not('rw_tags', 'is', null)
          .neq('rw_tags', '[]');
        
        // If we have existing approved jobs, only process highlights without tags
        if (existingJobs && existingJobs.length > 0) {
          // Get all highlights that already have tags
          const { data: highlightsWithTags } = await supabase
            .from('highlight_tags')
            .select('highlight_id');
          
          if (highlightsWithTags && highlightsWithTags.length > 0) {
            // Extract the IDs of highlights that already have tags
            const highlightIdsWithTags = highlightsWithTags.map(h => h.highlight_id);
            
            // Only process highlights that don't have tags yet
            if (highlightIdsWithTags.length > 0) {
              query = query.not('id', 'in', highlightIdsWithTags);
              logger.info(`Excluding ${highlightIdsWithTags.length} highlights that already have tags`);
            }
          }
        }
        
        const { data, error } = await query;
        
        if (error) {
          logger.error("Error fetching highlights:", error);
          throw error;
        }
        
        logger.info(`Found ${data?.length || 0} highlights with rw_tags that need processing`);
        return { data, error };
      });
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Create a categorization job to migrate the tags
      const migrateResult = await step.run("create-migration-job", async () => {
        if (!highlights || highlights.length === 0) {
          logger.info("No highlights with tags found that need migration, skipping");
          return { migrated: 0, success: true, jobId: null };
        }
        
        logger.info(`Creating categorization job for ${highlights.length} highlights`);
        
        // Prepare actions for the job
        const actions: any[] = [];
        
        for (const highlight of highlights) {
          if (!highlight.rw_tags || !Array.isArray(highlight.rw_tags) || highlight.rw_tags.length === 0) {
            continue;
          }
          
          // Create resource object for the highlight
          const resource = {
            id: highlight.id,
            type: 'highlight' as const,
            userId
          };
          
          // Add a create_tag action for each tag in rw_tags
          for (const tag of highlight.rw_tags) {
            // Handle tag being either a string or an object with a name property
            const tagName = typeof tag === 'string' ? tag : tag.name;
            
            if (tagName && tagName.trim()) {
              actions.push({
                actionType: 'create_tag',
                tagName: tagName.trim(),
                resource
              });
            }
          }
        }
        
        if (actions.length === 0) {
          logger.info("No valid tags found for migration");
          return { migrated: 0, success: true, jobId: null };
        }
        
        logger.info(`Prepared ${actions.length} tag actions for migration`);
        
        // Create the categorization job directly with Supabase instead of using the API
        try {
          // Start a transaction by creating the job first
          const { data: jobData, error: jobError } = await supabase
            .from('categorization_jobs')
            .insert({
              user_id: userId,
              name: "Migrate highlight rw_tags to proper tags",
              source: "system",
              status: 'pending'
            })
            .select()
            .single();
            
          if (jobError || !jobData) {
            throw new Error(`Failed to create job: ${jobError?.message || 'Unknown error'}`);
          }
          
          logger.info(`Created categorization job with ID: ${jobData.id}`);
          
          // Process all create_tag actions
          let createdTags = [];
          let tagMappings = new Map(); // Store mapping between tag names and IDs
          
          // First pass: create all unique tags
          const uniqueTagNames = new Set();
          actions.forEach(action => {
            if (action.actionType === 'create_tag' && action.tagName) {
              uniqueTagNames.add(action.tagName);
            }
          });
          
          logger.info(`Processing ${uniqueTagNames.size} unique tag names`);
          
          // Check if tags already exist
          for (const tagName of uniqueTagNames) {
            const { data: existingTag } = await supabase
              .from('tags')
              .select('id, name')
              .eq('name', tagName)
              .single();
              
            if (existingTag) {
              logger.info(`Tag '${tagName}' already exists with ID: ${existingTag.id}`);
              tagMappings.set(tagName, existingTag.id);
            } else {
              // Create the new tag
              const { data: newTag, error: createError } = await supabase
                .from('tags')
                .insert({
                  name: tagName,
                  created_by_job_id: jobData.id
                })
                .select()
                .single();
                
              if (createError || !newTag) {
                logger.error(`Failed to create tag '${tagName}': ${createError?.message || 'Unknown error'}`);
                continue;
              }
              
              logger.info(`Created new tag '${tagName}' with ID: ${newTag.id}`);
              tagMappings.set(tagName, newTag.id);
              createdTags.push(newTag);
            }
          }
          
          // Second pass: create action records and apply tag associations
          let appliedActions = 0;
          
          for (const action of actions) {
            if (action.actionType === 'create_tag' && action.tagName && action.resource) {
              const tagId = tagMappings.get(action.tagName);
              
              if (!tagId) {
                logger.error(`No tag ID found for '${action.tagName}', skipping action`);
                continue;
              }
              
              // Create the job action record
              const { data: jobAction, error: actionError } = await supabase
                .from('categorization_job_actions')
                .insert({
                  job_id: jobData.id,
                  action_type: 'add_tag',  // Use add_tag since we've already created/found the tag
                  resource_type: action.resource.type,
                  resource_id: action.resource.id,
                  tag_id: tagId
                })
                .select()
                .single();
                
              if (actionError || !jobAction) {
                logger.error(`Failed to create job action: ${actionError?.message || 'Unknown error'}`);
                continue;
              }
              
              // Apply the tag to the highlight
              const { error: applyError } = await supabase
                .from('highlight_tags')
                .upsert({
                  highlight_id: action.resource.id,
                  tag_id: tagId,
                  job_action_id: jobAction.id,
                  created_by: 'job'
                });
                
              if (applyError) {
                logger.error(`Failed to apply tag to highlight: ${applyError.message}`);
                continue;
              }
              
              appliedActions++;
            }
          }
          
          logger.info(`Successfully applied ${appliedActions} of ${actions.length} tag actions`);
          
          return { 
            migrated: appliedActions,
            jobId: jobData.id, 
            success: true 
          };
        } catch (error) {
          logger.error("Error creating categorization job:", error);
          throw error;
        }
      });
      
      logger.info("Migration completed successfully", { 
        migrated: migrateResult.migrated,
        jobId: migrateResult.jobId || null
      });
      
      return {
        success: true,
        migrated: migrateResult.migrated,
        jobId: migrateResult.jobId || null,
        isLastStep: true
      };
    } catch (error) {
      logger.error("Error in migration function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        migrated: 0,
        isLastStep: true
      };
    }
  }
);

// Function to import data from Airtable into Supabase
export const airtableImportDataFn = inngest.createFunction(
  { id: "airtable-import-data" },
  { event: "airtable/import-data" },
  async ({ event, step, logger }) => {
    const { userId, apiKey, baseId, tableId } = event.data;
    
    logger.info("Starting Airtable data import", { userId, baseId, tableId });
    
    if (!userId || !apiKey || !baseId || !tableId) {
      logger.error("Missing required parameters");
      return { 
        success: false, 
        error: "Missing required parameters",
        totalRows: 0,
        processedRows: 0,
        createdSparks: 0,
        createdCategories: 0,
        createdTags: 0,
        isLastStep: true
      };
    }

    // Initialize stats counters
    let totalRows = 0;
    let processedRows = 0;
    let createdSparks = 0;
    let createdCategories = 0;
    let createdTags = 0;
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("Missing Supabase configuration");
      return { 
        success: false, 
        error: "Server configuration error",
        totalRows: 0,
        processedRows: 0,
        createdSparks: 0,
        createdCategories: 0,
        createdTags: 0,
        isLastStep: true
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
      // Step 1: Fetch data from Airtable
      const airtableData = await step.run("fetch-airtable-data", async () => {
        logger.info("Fetching data from Airtable", { baseId, tableId });
        
        // Define API endpoint for Airtable table
        const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableId}`;
        
        let records: Array<{id: string, fields: Record<string, any>}> = [];
        let offset: string | null = null;
        
        do {
          const requestUrl = offset 
            ? `${airtableUrl}?offset=${offset}` 
            : airtableUrl;
            
          const response = await fetch(requestUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Airtable API error (${response.status}): ${errorText}`);
          }
          
          const data: { records: Array<{id: string, fields: Record<string, any>}>; offset?: string } = await response.json();
          records = [...records, ...data.records];
          offset = data.offset || null;
          
          logger.info(`Fetched ${data.records.length} records from Airtable (total: ${records.length})`);
        } while (offset);
        
        totalRows = records.length;
        logger.info(`Completed fetching all records from Airtable (total: ${totalRows})`);
        
        return records;
      });
      
      // Step 2: Retrieve existing categories and tags to avoid duplicates
      const existingData = await step.run("fetch-existing-data", async () => {
        logger.info("Fetching existing categories and tags from Supabase");
        
        // Get all categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name, slug');
          
        if (categoriesError) {
          logger.error("Error fetching categories:", categoriesError);
          throw categoriesError;
        }
        
        // Get all tags
        const { data: tags, error: tagsError } = await supabase
          .from('tags')
          .select('id, name');
          
        if (tagsError) {
          logger.error("Error fetching tags:", tagsError);
          throw tagsError;
        }
        
        // Create maps for easier lookup - using Record instead of Map for serialization
        const categoryMap: Record<string, {id: string, name: string, slug: string}> = {};
        if (categories) {
          categories.forEach(category => {
            categoryMap[category.name.toLowerCase()] = category;
          });
        }
        
        const tagMap: Record<string, {id: string, name: string}> = {};
        if (tags) {
          tags.forEach(tag => {
            tagMap[tag.name.toLowerCase()] = tag;
          });
        }
        
        logger.info(`Found ${categories?.length || 0} existing categories and ${tags?.length || 0} existing tags`);
        
        return { categoryMap, tagMap };
      });
      
      const { categoryMap, tagMap } = existingData;
      
      // Step 3: Process Airtable data
      const processResult = await step.run("process-airtable-data", async () => {
        logger.info(`Processing ${airtableData.length} rows from Airtable`);
        
        // Function to create a slug from a name
        const createSlug = (name: string): string => {
          return name.toLowerCase()
            .replace(/[^\w\s-]/g, '')  // Remove special characters
            .replace(/\s+/g, '-')      // Replace spaces with hyphens
            .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen
        };
        
        // Process each record from Airtable
        for (const record of airtableData) {
          try {
            const fields = record.fields;
            processedRows++;

            // Log the raw fields for debugging
            logger.info(`Record ${record.id} fields:`, fields);

            // Extract data from Airtable fields based on the specific field mappings
            const body = fields.content || '';
            const categories = fields["Name (from Categories)"] || [];
            const tags = fields["Name (from Tags)"] || [];
            const uid = fields.uid;
            const originallyCreated = fields.originallyCreated;
            const todoId = fields.toDoId;
            
            // Skip if body is empty
            if (!body) {
              logger.warn(`Skipping record ${record.id} due to empty body`);
              continue;
            }
            
            // Use the uid field from Airtable for md5_uid if available, otherwise generate one
            let md5_uid;
            if (uid) {
              md5_uid = uid;
              logger.info(`Using provided uid for record ${record.id}: ${md5_uid}`);
            }
            
            // Check if spark already exists
            const { data: existingSpark } = await supabase
              .from('sparks')
              .select('id')
              .eq('md5_uid', md5_uid)
              .eq('user_id', userId)
              .maybeSingle();
              
            if (existingSpark) {
              logger.info(`Spark already exists for record ${record.id}, skipping`);
              continue;
            }
            
            // Create new spark with additional fields if available
            const sparkData: {
              user_id: string;
              body: string;
              md5_uid: string;
              todo_created_at?: string;
              todo_id?: string;
            } = {
              user_id: userId,
              body: body,
              md5_uid: md5_uid
            };
            
            // Add todo_created_at if originallyCreated is available
            if (originallyCreated) {
              sparkData.todo_created_at = originallyCreated;
            }
            
            // Add todo_id if todoId is available
            if (todoId) {
              sparkData.todo_id = todoId;
            }
            
            const { data: newSpark, error: sparkError } = await supabase
              .from('sparks')
              .insert(sparkData)
              .select('id')
              .single();
              
            if (sparkError) {
              logger.error(`Error creating spark for record ${record.id}:`, sparkError);
              continue;
            }
            
            createdSparks++;
            logger.info(`Created spark ${newSpark.id} for record ${record.id}`);
            
            // Create a categorization job for this record
            const { data: jobData, error: jobError } = await supabase
              .from('categorization_jobs')
              .insert({
                user_id: userId,
                name: `Airtable import for record ${record.id}`,
                source: "airtable_import",
                status: 'approved'
              })
              .select()
              .single();
              
            if (jobError || !jobData) {
              logger.error(`Failed to create job for record ${record.id}:`, jobError);
              continue;
            }
            
            logger.info(`Created categorization job with ID: ${jobData.id} for record ${record.id}`);
            
            // Process categories - expect array of strings of length 1
            if (Array.isArray(categories) && categories.length > 0) {
              // Take the first string in the array (as specified)
              const categoryName = categories[0];
              
              if (categoryName) {
                const categoryLower = categoryName.toLowerCase();
                let categoryId;
                
                // Check if category exists, otherwise create it
                if (categoryLower in categoryMap) {
                  categoryId = categoryMap[categoryLower].id;
                } else {
                  const slug = createSlug(categoryName);
                  
                  const { data: newCategory, error: categoryError } = await supabase
                    .from('categories')
                    .insert({
                      name: categoryName,
                      slug: slug,
                      created_by_job_id: jobData.id
                    })
                    .select('id')
                    .single();
                    
                  if (categoryError) {
                    logger.error(`Error creating category ${categoryName}:`, categoryError);
                  } else {
                    categoryId = newCategory.id;
                    categoryMap[categoryLower] = { id: categoryId, name: categoryName, slug };
                    createdCategories++;
                    logger.info(`Created category "${categoryName}" with ID ${categoryId}`);
                  }
                }
                
                if (categoryId) {
                  // Create job action for this category
                  logger.info(`Creating job action for category "${categoryName}" (ID: ${categoryId})`);
                  const { data: jobAction, error: actionError } = await supabase
                    .from('categorization_job_actions')
                    .insert({
                      job_id: jobData.id,
                      action_type: 'add_category',
                      resource_type: 'spark',
                      resource_id: newSpark.id,
                      category_id: categoryId
                    })
                    .select()
                    .single();
                    
                  if (actionError || !jobAction) {
                    logger.error(`Failed to create job action for category ${categoryName}:`, actionError);
                    continue;
                  }
                  
                  // Link category to spark with job_action_id
                  logger.info(`Linking category "${categoryName}" (ID: ${categoryId}) to spark ${newSpark.id} with action ID ${jobAction.id}`);
                  const { data: sparkCategory, error: linkError } = await supabase
                    .from('spark_categories')
                    .insert({
                      spark_id: newSpark.id,
                      category_id: categoryId,
                      created_by: 'job',
                      job_action_id: jobAction.id
                    })
                    .select()
                    .single();
                    
                  if (linkError) {
                    logger.error(`Error linking category ${categoryId} to spark ${newSpark.id}:`, linkError);
                    // Log more detail about the error
                    if (linkError.code) {
                      logger.error(`SQL error code: ${linkError.code}, Details: ${linkError.details}, Hint: ${linkError.hint}`);
                    }
                  } else {
                    logger.info(`Successfully linked category "${categoryName}" to spark ${newSpark.id}`);
                  }
                }
              }
            }
            
            // Process tags - array of strings
            if (Array.isArray(tags) && tags.length > 0) {
              for (const tagName of tags) {
                if (!tagName) continue;
                
                const tagLower = tagName.toLowerCase();
                let tagId;
                
                // Check if tag exists, otherwise create it
                if (tagLower in tagMap) {
                  tagId = tagMap[tagLower].id;
                } else {
                  const { data: newTag, error: tagError } = await supabase
                    .from('tags')
                    .insert({
                      name: tagName,
                      created_by_job_id: jobData.id
                    })
                    .select('id')
                    .single();
                    
                  if (tagError) {
                    logger.error(`Error creating tag ${tagName}:`, tagError);
                    continue;
                  }
                  
                  tagId = newTag.id;
                  tagMap[tagLower] = { id: tagId, name: tagName };
                  createdTags++;
                  logger.info(`Created tag "${tagName}" with ID ${tagId}`);
                }
                
                // Create job action for this tag
                const { data: jobAction, error: actionError } = await supabase
                  .from('categorization_job_actions')
                  .insert({
                    job_id: jobData.id,
                    action_type: 'add_tag',
                    resource_type: 'spark',
                    resource_id: newSpark.id,
                    tag_id: tagId
                  })
                  .select()
                  .single();
                  
                if (actionError || !jobAction) {
                  logger.error(`Failed to create job action for tag ${tagName}:`, actionError);
                  continue;
                }
                
                // Link tag to spark with job_action_id
                const { error: linkError } = await supabase
                  .from('spark_tags')
                  .insert({
                    spark_id: newSpark.id,
                    tag_id: tagId,
                    created_by: 'job',
                    job_action_id: jobAction.id
                  });
                  
                if (linkError) {
                  logger.error(`Error linking tag ${tagId} to spark ${newSpark.id}:`, linkError);
                }
              }
            }
            
            // Log progress every 10 records
            if (processedRows % 10 === 0) {
              logger.info(`Processed ${processedRows}/${totalRows} rows. Created ${createdSparks} sparks, ${createdCategories} categories, ${createdTags} tags`);
            }
          } catch (recordError) {
            logger.error(`Error processing record ${record.id}:`, recordError);
          }
        }
        
        logger.info(`Completed processing. Processed ${processedRows}/${totalRows} rows`);
        logger.info(`Created ${createdSparks} sparks, ${createdCategories} categories, ${createdTags} tags`);
        
        return {
          processedRows,
          createdSparks,
          createdCategories,
          createdTags,
          success: true
        };
      });
      
      logger.info("Airtable import completed successfully");
      
      return {
        success: true,
        totalRows,
        processedRows: processResult.processedRows,
        createdSparks: processResult.createdSparks,
        createdCategories: processResult.createdCategories,
        createdTags: processResult.createdTags,
        isLastStep: true
      };
    } catch (error) {
      logger.error("Error in Airtable import function:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        totalRows,
        processedRows,
        createdSparks,
        createdCategories,
        createdTags,
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
    readwiseSyncBooksFn,
    readwiseSyncHighlightsFn,
    migrateHighlightTagsFn,
    airtableImportDataFn
  ],
});