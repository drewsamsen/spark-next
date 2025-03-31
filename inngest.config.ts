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
  "readwise/sync-highlights": {
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
      // Step 1: Fetch books with highlight counts to process (limit to 3 for now)
      const bookResult = await step.run("fetch-books-to-sync", async () => {
        logger.info("Step 1: Fetching books to sync highlights for");
        
        const { data, error } = await supabase
          .from('books')
          .select('id, rw_id, rw_title, rw_num_highlights')
          .eq('user_id', userId)
          .order('rw_title', { ascending: true })
          .limit(3); // Limit to 3 books as requested
          
        if (error) {
          logger.error("Error fetching books:", error);
          throw error;
        }
        
        logger.info(`Found ${data?.length || 0} books to check for highlights`);
        return { books: data || [], success: true };
      });
      
      if (!bookResult.success || bookResult.books.length === 0) {
        logger.error("No books found to sync highlights for");
        return { 
          success: false, 
          error: "No books found",
          isLastStep: true
        };
      }

      // Track overall sync statistics
      let totalHighlightsInReadwise = 0;
      let totalHighlightsInSupabase = 0;
      let totalHighlightsInserted = 0;
      let totalHighlightsUpdated = 0;
      
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
          totalHighlightsInSupabase += existingHighlightsCount;
          
          logger.info(`Found ${existingHighlightsCount} existing highlights in Supabase for book ${book.rw_title}`);
          
          // Create a map of existing highlights for faster lookups
          const highlightsMap = new Map();
          existingHighlights?.forEach(highlight => {
            highlightsMap.set(Number(highlight.rw_id), {
              id: highlight.id,
              rwUpdated: new Date(highlight.rw_updated || 0)
            });
          });
          
          // If we already have all the highlights (according to the book's highlight count), we can skip this book
          if (existingHighlightsCount >= (book.rw_num_highlights || 0)) {
            logger.info(`Book ${book.rw_title} already has all ${book.rw_num_highlights} highlights. Skipping.`);
            results.push({
              bookId: book.id,
              rwBookId: book.rw_id,
              title: book.rw_title,
              success: true,
              existing: existingHighlightsCount,
              expected: book.rw_num_highlights,
              inserted: 0,
              updated: 0
            });
            continue; // Skip to the next book
          }
          
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
            
            // Add a small delay to respect rate limits
            if (page > 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
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
              const highlights = data.results || [];
              
              // Add the highlights from this page to the total count
              readwiseHighlightsCount += highlights.length;
              totalHighlightsInReadwise += highlights.length;
              
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
                totalHighlightsInserted += batch.length;
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
                  totalHighlightsUpdated++;
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
        totalHighlightsInReadwise,
        totalHighlightsInSupabase,
        totalHighlightsInserted,
        totalHighlightsUpdated
      });
      
      return { 
        success: true, 
        booksProcessed: bookResult.books.length,
        totalHighlightsInReadwise,
        totalHighlightsInSupabase,
        totalHighlightsInserted,
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

// Export the serve function for use in API routes
export const serveInngest = serve({
  client: inngest,
  functions: [
    readwiseCountBooksFn,
    readwiseConnectionTestFn,
    readwiseSyncBooksFn,
    readwiseSyncHighlightsFn
  ],
});
