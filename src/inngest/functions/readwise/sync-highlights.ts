import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { throttledReadwiseRequest } from "../../utils/readwise-api";
import { createClient } from "@supabase/supabase-js";

// Function to import highlights from Readwise to Supabase
export const readwiseSyncHighlightsFn = inngest.createFunction(
  { id: "readwise-sync-highlights" },
  { event: "readwise/sync-highlights" },
  async ({ event, step, logger }) => {
    const { userId, apiKey } = event.data;

    logger.info("Starting Readwise highlights import", { userId });

    if (!userId || !apiKey) {
      logger.error("Missing user ID or API key");
      return markAsError({
        success: false,
        error: "Missing user ID or API key",
        totalHighlights: 0,
        upserted: 0,
        existingHighlights: 0
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
        totalHighlights: 0,
        upserted: 0,
        existingHighlights: 0
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // Step 1: Get the books first to create a map of book ids
      const booksResult = await step.run("fetch-book-ids", async () => {
        logger.info("Fetching books to create book ID mapping");

        const { data, error } = await supabase
          .from('books')
          .select('id, rw_id')
          .eq('user_id', userId);

        if (error) {
          logger.error("Error fetching books:", error);
          throw error;
        }

        // Create a map of readwise book IDs to our internal IDs
        const bookMap = new Map();
        for (const book of (data || [])) {
          bookMap.set(Number(book.rw_id), book.id);
        }

        logger.info(`Created book mapping with ${bookMap.size} books`);

        return {
          bookMap: Object.fromEntries(bookMap),
          success: true
        };
      });

      if (!booksResult.success) {
        logger.error("Failed to fetch book mapping");
        return markAsError({
          success: false,
          error: "Failed to create book mapping",
          totalHighlights: 0,
          upserted: 0,
          existingHighlights: 0
        });
      }

      // Reconstruct the bookMap from the object
      const bookMap = new Map(Object.entries(booksResult.bookMap).map(([k, v]) => [Number(k), v]));

      // Step 2: Get last sync timestamp to determine sync type
      const lastSyncResult = await step.run("fetch-last-sync-timestamp", async () => {
        logger.info("Fetching last sync timestamp from user settings");

        const { data: userSettings, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('id', userId)
          .single();

        if (error) {
          logger.warn("Error fetching user settings, will perform full sync:", error);
          return { lastSynced: null, success: true };
        }

        const lastSynced = userSettings?.settings?.integrations?.readwise?.lastSyncTime || null;
        logger.info(`Last sync timestamp: ${lastSynced || 'none (first sync)'}`);

        return { lastSynced, success: true };
      });

      const lastSynced = lastSyncResult.lastSynced;
      const syncType = lastSynced ? 'incremental' : 'full';
      logger.info(`Performing ${syncType} sync`);

      // Step 3: Conditionally fetch existing highlights (only for full syncs)
      let existingHighlightsCount = 0;

      if (syncType === 'full') {
        const fetchResult = await step.run("fetch-existing-highlights", async () => {
          logger.info(`Full sync detected - fetching existing highlights for user ${userId} from database`);

          const { data, error } = await supabase
            .from('highlights')
            .select('id, rw_id')
            .eq('user_id', userId);

          if (error) {
            logger.error("Error fetching existing highlights:", error);
            throw error;
          }

          logger.info(`Found ${data?.length || 0} existing highlights in database`);

          return {
            highlightsData: data || [],
            success: true
          };
        });

        if (!fetchResult.success) {
          logger.error("Failed to fetch existing highlights");
          return markAsError({
            success: false,
            error: "Failed to fetch existing highlights",
            totalHighlights: 0,
            upserted: 0,
            existingHighlights: 0
          });
        }

        existingHighlightsCount = fetchResult.highlightsData.length;
        logger.info(`Total highlights in Supabase: ${existingHighlightsCount}`);
      } else {
        logger.info("Incremental sync detected - skipping existing highlights fetch (relying on upsert conflict resolution)");
        existingHighlightsCount = 0; // Will be determined from database post-sync if needed
      }

      // Step 4: Import highlights from Readwise API with batch processing
      logger.info("Starting to import highlights from Readwise");
      const importResult = await step.run("import-highlights-from-readwise", async () => {
        logger.info(`Importing Readwise highlights for user ${userId} (${syncType} sync)`);

        // Construct URL with incremental sync parameter if available
        const baseUrl = "https://readwise.io/api/v2/highlights/";
        const readwiseUrl = lastSynced 
          ? `${baseUrl}?updated__gt=${lastSynced}`
          : baseUrl;

        logger.info(`Readwise API URL: ${readwiseUrl}`);

        // Track API timing
        const apiStartTime = Date.now();

        let nextUrl = readwiseUrl;
        let highlightsToUpsert = [];
        let totalReadwiseHighlights = 0;
        let page = 1;
        let highlightsWithoutBooks = 0;

        // Process all pages of results
        while (nextUrl) {
          logger.info(`Fetching highlights page ${page} from ${nextUrl}`);

          try {
            // Use throttled request function
            const data = await throttledReadwiseRequest(nextUrl, apiKey, logger);
            const highlights = data.results || [];

            // Add the highlights from this page to the total count
            totalReadwiseHighlights += highlights.length;
            logger.info(`Received ${highlights.length} highlights from Readwise API (total so far: ${totalReadwiseHighlights})`);

            // Process all highlights on this page in memory
            for (const highlight of highlights) {
              // Skip highlights without a book_id - we need to import books first
              if (!highlight.book_id) {
                logger.warn(`Highlight ${highlight.id} has no book_id, skipping`);
                highlightsWithoutBooks++;
                continue;
              }

              // Look up our internal book ID from the Readwise book ID
              const bookId = bookMap.get(Number(highlight.book_id));
              
              // Skip highlights for books we don't have
              if (!bookId) {
                logger.warn(`Highlight ${highlight.id} book not found (Readwise book_id: ${highlight.book_id}), skipping`);
                highlightsWithoutBooks++;
                continue;
              }

              // Map Readwise highlight properties to Supabase table columns
              const highlightData = {
                user_id: userId,
                book_id: bookId,
                rw_id: highlight.id,
                rw_text: highlight.text,
                rw_note: highlight.note,
                rw_location: highlight.location,
                rw_location_type: highlight.location_type,
                rw_highlighted_at: highlight.highlighted_at,
                rw_updated: highlight.updated,
                rw_book_id: highlight.book_id,
                rw_url: highlight.url,
                rw_color: highlight.color,
                rw_tags: highlight.tags || []
              };

              // Add to upsert batch (handles both inserts and updates)
              highlightsToUpsert.push(highlightData);
            }

            logger.info(`Page ${page}: Processed ${highlights.length} highlights. Cumulative totals - To upsert: ${highlightsToUpsert.length}, Without books: ${highlightsWithoutBooks}`);

            // Check if there's another page
            nextUrl = data.next || null;
            page++;

            // Safety check to prevent infinite loops
            if (page > 250) {
              logger.warn("Reached 250 pages - stopping to prevent potential infinite loop");
              break;
            }
          } catch (error) {
            logger.error(`Error processing Readwise API highlights page ${page}:`, error);
            throw error;
          }
        }

        // Log API fetch metrics
        const apiDuration = Date.now() - apiStartTime;
        const apiDurationSeconds = (apiDuration / 1000).toFixed(2);
        logger.info(`API Fetch Summary: ${page - 1} pages fetched, ${totalReadwiseHighlights} highlights received in ${apiDurationSeconds}s`);
        
        logger.info(`Finished processing all highlights. Ready to upsert: ${highlightsToUpsert.length}, Without books: ${highlightsWithoutBooks}`);

        // Execute batch upsert operations
        let upsertedCount = 0;
        const failedBatches: Array<{ batchIndex: number; batchNumber: number; error: any }> = [];

        logger.info("Starting database operations for highlight upsert");
        
        // Track database operation timing
        const dbStartTime = Date.now();

        // Upsert highlights in batches of 100
        if (highlightsToUpsert.length > 0) {
          logger.info(`Beginning upsert of ${highlightsToUpsert.length} highlights`);
          // Process in smaller batches to avoid hitting size limits
          const batchSize = 100;
          const totalBatches = Math.ceil(highlightsToUpsert.length / batchSize);
          
          for (let i = 0; i < highlightsToUpsert.length; i += batchSize) {
            const batch = highlightsToUpsert.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            
            logger.info(`Upserting batch ${batchNumber} of ${totalBatches}: ${batch.length} highlights`);

            try {
              const { error: upsertError } = await supabase
                .from('highlights')
                .upsert(batch, { 
                  onConflict: 'user_id,rw_id',
                  ignoreDuplicates: false 
                });

              if (upsertError) {
                throw upsertError;
              }
              
              upsertedCount += batch.length;
              logger.info(`Successfully upserted batch ${batchNumber}: ${batch.length} highlights`);
            } catch (error) {
              // Log the error but continue processing remaining batches
              logger.error(`Batch ${batchNumber} (index ${i}) failed:`, {
                error: error instanceof Error ? error.message : String(error),
                batchSize: batch.length,
                startIndex: i
              });
              
              // Track failed batch for final report
              failedBatches.push({
                batchIndex: i,
                batchNumber,
                error: error instanceof Error ? error.message : String(error)
              });
            }
          }
        } else {
          logger.info("No highlights to upsert");
        }

        // Log database operation metrics
        const dbDuration = Date.now() - dbStartTime;
        const dbDurationSeconds = (dbDuration / 1000).toFixed(2);
        const batchCount = Math.ceil(highlightsToUpsert.length / 100);
        const failedCount = failedBatches.length;
        
        if (failedCount > 0) {
          logger.warn(`DB Operation Summary: ${batchCount} batches processed, ${upsertedCount} highlights upserted, ${failedCount} batches failed in ${dbDurationSeconds}s`, {
            failedBatches: failedBatches.map(fb => ({
              batchNumber: fb.batchNumber,
              error: fb.error
            }))
          });
        } else {
          logger.info(`DB Operation Summary: ${batchCount} batches processed, ${upsertedCount} highlights upserted in ${dbDurationSeconds}s`);
        }

        // Get total highlight count for this user after sync (optional monitoring metric)
        let totalHighlightsInDb = 0;
        try {
          const { count, error: countError } = await supabase
            .from('highlights')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

          if (!countError && count !== null) {
            totalHighlightsInDb = count;
            logger.info(`Total highlights in database for user: ${totalHighlightsInDb}`);
          }
        } catch (error) {
          logger.warn("Could not fetch total highlight count:", error);
        }

        logger.info(`Completed database operations. Upserted: ${upsertedCount}${failedBatches.length > 0 ? `, Failed batches: ${failedBatches.length}` : ''}`);

        return {
          upserted: upsertedCount,
          totalHighlights: totalReadwiseHighlights,
          withoutBooks: highlightsWithoutBooks,
          totalInDatabase: totalHighlightsInDb,
          apiDuration: apiDurationSeconds,
          dbDuration: dbDurationSeconds,
          pagesProcessed: page - 1,
          failedBatches: failedBatches.length > 0 ? failedBatches : undefined,
          failedBatchCount: failedBatches.length,
          success: true
        };
      });

      // Update user settings with the sync time
      logger.info("Step 5: Updating user settings with sync timestamp");
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
      const hasFailures = importResult.failedBatchCount > 0;
      const logMessage = hasFailures 
        ? "Highlights sync completed with partial failures"
        : "Highlights sync completed successfully";
      
      const logLevel = hasFailures ? 'warn' : 'info';
      logger[logLevel](logMessage, {
        syncType,
        totalHighlights: importResult.totalHighlights,
        existingHighlights: existingHighlightsCount,
        upserted: importResult.upserted,
        withoutBooks: importResult.withoutBooks,
        totalInDatabase: importResult.totalInDatabase,
        apiDuration: `${importResult.apiDuration}s`,
        dbDuration: `${importResult.dbDuration}s`,
        pagesProcessed: importResult.pagesProcessed,
        ...(hasFailures && { 
          failedBatchCount: importResult.failedBatchCount,
          failedBatches: importResult.failedBatches 
        })
      });

      return markAsLastStep({
        success: true,
        syncType,
        totalHighlights: importResult.totalHighlights,
        existingHighlights: existingHighlightsCount,
        upserted: importResult.upserted,
        withoutBooks: importResult.withoutBooks,
        totalInDatabase: importResult.totalInDatabase,
        apiDuration: importResult.apiDuration,
        dbDuration: importResult.dbDuration,
        pagesProcessed: importResult.pagesProcessed,
        ...(hasFailures && {
          failedBatchCount: importResult.failedBatchCount,
          failedBatches: importResult.failedBatches
        })
      });
    } catch (error) {
      logger.error("Error in Readwise sync highlights function:", error);
      return markAsError({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        totalHighlights: 0,
        upserted: 0,
        existingHighlights: 0
      });
    }
  }
); 