import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { throttledReadwiseRequest } from "../../utils/readwise-api";
import { createClient } from "@supabase/supabase-js";

// Function to import books from Readwise to Supabase
export const readwiseSyncBooksFn = inngest.createFunction(
  { id: "readwise-sync-books" },
  { event: "readwise/sync-books" },
  async ({ event, step, logger }) => {
    const { userId, apiKey } = event.data;
    
    logger.info("Starting Readwise book import", { userId });
    
    if (!userId || !apiKey) {
      logger.error("Missing user ID or API key");
      return markAsError({ 
        success: false, 
        error: "Missing user ID or API key",
        readwiseBooks: 0,
        sparkBooks: 0,
        imported: 0,
        updated: 0
      });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("Missing Supabase configuration");
      return markAsError({ 
        success: false, 
        error: "Server configuration error",
        readwiseBooks: 0,
        sparkBooks: 0,
        imported: 0,
        updated: 0
      });
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
        return markAsError({ 
          success: false, 
          error: "Failed to fetch existing books",
          readwiseBooks: 0,
          sparkBooks: 0,
          imported: 0,
          updated: 0
        });
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
          .select('settings')
          .eq('id', userId)
          .single();
        
        if (getError) {
          logger.error("Failed to get current user settings", getError);
          return { success: false };
        }
        
        // Merge existing settings with new lastSyncTime timestamp
        const updatedSettings = {
          settings: {
            ...(currentSettings?.settings || {}),
            integrations: {
              ...(currentSettings?.settings?.integrations || {}),
              readwise: {
                ...(currentSettings?.settings?.integrations?.readwise || {}),
                lastSyncTime: new Date().toISOString()
              }
            }
          }
        };
        
        // Update settings
        const { error } = await supabase
          .from('user_settings')
          .update(updatedSettings)
          .eq('id', userId);
          
        if (error) {
          logger.error("Failed to update last synced timestamp", error);
          return { success: false };
        }
        
        return { success: true };
      });
      
      // Final log and return
      logger.info("Book sync completed successfully", { 
        readwiseBooks: importResult.readwiseBooks,
        sparkBooks: sparkBooksCount,
        imported: importResult.imported,
        updated: importResult.updated
      });
      
      return markAsLastStep({ 
        success: true,
        readwiseBooks: importResult.readwiseBooks,
        sparkBooks: sparkBooksCount,
        imported: importResult.imported,
        updated: importResult.updated
      });
    } catch (error) {
      logger.error("Error in Readwise sync books function:", error);
      return markAsError({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        readwiseBooks: 0,
        sparkBooks: 0,
        imported: 0,
        updated: 0
      });
    }
  }
); 