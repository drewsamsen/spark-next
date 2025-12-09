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
      // Step 0: Sync books first to ensure all books are up-to-date
      await step.run("sync-books-first", async () => {
        logger.info("Triggering books sync to ensure all books are current before syncing highlights");
        
        // Send event to trigger books sync
        await inngest.send({
          name: "readwise/sync-books",
          data: {
            userId,
            apiKey
          }
        });
        
        logger.info("Books sync event sent");
        return { success: true };
      });

      // Wait a moment for books to sync (you may want to use step.waitForEvent for more robust sync)
      await step.sleep("wait-for-books-sync", "30s");

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

      // Step 2: Get last sync state to determine sync strategy
      const lastSyncResult = await step.run("fetch-last-sync-state", async () => {
        logger.info("Fetching last sync state from user settings");

        const { data: userSettings, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('id', userId)
          .single();

        if (error) {
          logger.warn("Error fetching user settings, will start fresh pagination:", error);
          return { 
            lastSynced: null, 
            lastFullSync: null, 
            paginationCursor: null,
            isFullySynced: false,
            success: true 
          };
        }

        const readwiseSettings = userSettings?.settings?.integrations?.readwise || {};
        const lastSynced = readwiseSettings.lastSyncTime || null;
        const lastFullSync = readwiseSettings.lastFullSyncTime || null;
        const paginationCursor = readwiseSettings.paginationCursor || null;
        const isFullySynced = readwiseSettings.isFullySynced || false;
        
        logger.info(`Last incremental sync (stored): ${lastSynced || 'none'}`);
        logger.info(`Last full sync: ${lastFullSync || 'none'}`);
        logger.info(`Pagination cursor: ${paginationCursor || 'none (start from beginning)'}`);
        logger.info(`Fully synced: ${isFullySynced}`);

        return { lastSynced, lastFullSync, paginationCursor, isFullySynced, success: true };
      });

      const lastSynced = lastSyncResult.lastSynced;
      const lastFullSync = lastSyncResult.lastFullSync;
      const paginationCursor = lastSyncResult.paginationCursor;
      const isFullySynced = lastSyncResult.isFullySynced;

      // Step 2b: Get most recent highlight from database to determine true sync baseline
      const mostRecentHighlightResult = await step.run("fetch-most-recent-highlight", async () => {
        logger.info("Fetching most recent highlight timestamp from database (source of truth)");

        const { data: recentHighlight, error } = await supabase
          .from('highlights')
          .select('rw_updated')
          .eq('user_id', userId)
          .not('rw_updated', 'is', null)
          .order('rw_updated', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          // No highlights found or error - this is expected for first sync
          if (error.code === 'PGRST116') {
            logger.info("No existing highlights found in database - will perform full sync");
            return { mostRecentTimestamp: null, success: true };
          }
          logger.warn("Error fetching most recent highlight, will use stored timestamp if available:", error);
          return { mostRecentTimestamp: null, success: true };
        }

        const mostRecentTimestamp = recentHighlight?.rw_updated || null;
        logger.info(`Most recent highlight in database: ${mostRecentTimestamp || 'none'}`);

        return { mostRecentTimestamp, success: true };
      });

      const mostRecentHighlightTimestamp = mostRecentHighlightResult.mostRecentTimestamp;
      
      // Determine sync strategy:
      // 1. If we have a pagination cursor, continue chunked sync from where we left off
      // 2. If fully synced AND last full sync < 10 days, do incremental (updated only)
      // 3. If fully synced AND last full sync > 10 days, restart full pagination
      // 4. If never synced, start fresh pagination
      const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
      const ONE_HOUR_MS = 60 * 60 * 1000; // Safety buffer for incremental sync
      const now = Date.now();
      
      let syncType: 'chunked-full' | 'chunked-continue' | 'incremental';
      let shouldResetPagination = false;
      let incrementalSyncTimestamp: string | null = null;
      
      if (paginationCursor) {
        // Continue from where we left off
        syncType = 'chunked-continue';
        logger.info(`Continuing chunked sync from cursor: ${paginationCursor}`);
      } else if (isFullySynced && lastFullSync && (now - new Date(lastFullSync).getTime() <= TEN_DAYS_MS)) {
        // Fully synced recently, just get updates
        syncType = 'incremental';
        
        // Use database timestamp as source of truth, with 1-hour safety buffer
        if (mostRecentHighlightTimestamp) {
          const mostRecentTime = new Date(mostRecentHighlightTimestamp).getTime();
          const safeStartTime = mostRecentTime - ONE_HOUR_MS;
          incrementalSyncTimestamp = new Date(safeStartTime).toISOString();
          logger.info(`Performing incremental sync - using database timestamp with 1-hour safety buffer`);
          logger.info(`Most recent highlight in DB: ${mostRecentHighlightTimestamp}`);
          logger.info(`Will fetch highlights updated after: ${incrementalSyncTimestamp} (1 hour before most recent)`);
        } else {
          // Fallback to stored timestamp if database query failed (shouldn't happen in normal case)
          incrementalSyncTimestamp = lastSynced;
          logger.warn(`No database timestamp available, falling back to stored lastSyncTime: ${incrementalSyncTimestamp}`);
        }
      } else {
        // Need to start/restart full pagination
        syncType = 'chunked-full';
        shouldResetPagination = true;
        
        if (lastFullSync) {
          const daysSinceFullSync = Math.floor((now - new Date(lastFullSync).getTime()) / (24 * 60 * 60 * 1000));
          logger.info(`Starting new chunked full sync - last full sync was ${daysSinceFullSync} days ago (threshold: 10 days)`);
        } else {
          logger.info(`Starting new chunked full sync - ${!mostRecentHighlightTimestamp ? 'first sync ever' : 'no previous full sync recorded'}`);
        }
      }

      // Step 3: No need to fetch existing highlights for chunked syncs
      // We rely on upsert conflict resolution for all sync types now
      let existingHighlightsCount = 0;
      logger.info("Using upsert conflict resolution - skipping existing highlights fetch");

      // Step 4: Import highlights from Readwise API with chunked processing
      logger.info("Starting to import highlights from Readwise");
      const importResult = await step.run("import-highlights-from-readwise", async () => {
        logger.info(`Importing Readwise highlights for user ${userId} (${syncType} sync)`);

        // Determine starting URL based on sync type
        const baseUrl = "https://readwise.io/api/v2/highlights/";
        let startUrl: string;
        
        if (syncType === 'incremental' && incrementalSyncTimestamp) {
          // Incremental: only get updated highlights using database-derived timestamp
          startUrl = `${baseUrl}?updated__gt=${incrementalSyncTimestamp}`;
          logger.info(`Incremental sync - fetching highlights updated after ${incrementalSyncTimestamp}`);
          logger.info(`Using database-derived timestamp (source of truth) instead of stored lastSyncTime`);
        } else if (syncType === 'chunked-continue' && paginationCursor) {
          // Continue from saved cursor
          startUrl = paginationCursor;
          logger.info(`Continuing chunked sync from saved cursor`);
        } else {
          // Start fresh full sync
          startUrl = baseUrl;
          logger.info(`Starting new full sync from beginning`);
        }

        logger.info(`Readwise API URL: ${startUrl}`);

        // Track API timing
        const apiStartTime = Date.now();

        let highlightsToUpsert = [];
        let totalReadwiseHighlights = 0;
        let highlightsWithoutBooks = 0;
        let nextCursor: string | null = null;
        let reachedEnd = false;

        // CHUNKED SYNC: Only fetch up to 500 highlights per run
        const MAX_HIGHLIGHTS_PER_RUN = 500;
        let currentUrl = startUrl;
        let pagesProcessed = 0;

        while (currentUrl && totalReadwiseHighlights < MAX_HIGHLIGHTS_PER_RUN) {
          pagesProcessed++;
          logger.info(`Fetching highlights page ${pagesProcessed} from ${currentUrl}`);

          try {
            // Use throttled request function
            const data = await throttledReadwiseRequest(currentUrl, apiKey, logger);
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

            logger.info(`Page ${pagesProcessed}: Processed ${highlights.length} highlights. Cumulative totals - To upsert: ${highlightsToUpsert.length}, Without books: ${highlightsWithoutBooks}`);

            // Save the next cursor for continuation
            nextCursor = data.next || null;
            
            if (!nextCursor) {
              // No more pages available - we've reached the end
              reachedEnd = true;
              logger.info("Reached end of highlights - no more pages available");
              break;
            }

            // Check if we've hit our limit for this run
            if (totalReadwiseHighlights >= MAX_HIGHLIGHTS_PER_RUN) {
              logger.info(`Reached chunk limit of ${MAX_HIGHLIGHTS_PER_RUN} highlights for this run`);
              break;
            }

            // Continue to next page
            currentUrl = nextCursor;
          } catch (error) {
            logger.error(`Error processing Readwise API highlights page ${pagesProcessed}:`, error);
            throw error;
          }
        }

        // Log API fetch metrics
        const apiDuration = Date.now() - apiStartTime;
        const apiDurationSeconds = (apiDuration / 1000).toFixed(2);
        logger.info(`API Fetch Summary: ${pagesProcessed} pages fetched, ${totalReadwiseHighlights} highlights received in ${apiDurationSeconds}s`);
        
        if (reachedEnd) {
          logger.info(`Finished processing - reached end of all highlights. Ready to upsert: ${highlightsToUpsert.length}, Without books: ${highlightsWithoutBooks}`);
        } else if (nextCursor) {
          logger.info(`Finished processing chunk. Ready to upsert: ${highlightsToUpsert.length}, Without books: ${highlightsWithoutBooks}. Will continue from cursor in next run.`);
        } else {
          logger.info(`Finished processing highlights. Ready to upsert: ${highlightsToUpsert.length}, Without books: ${highlightsWithoutBooks}`);
        }

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
          pagesProcessed: pagesProcessed,
          nextCursor: nextCursor,
          reachedEnd: reachedEnd,
          failedBatches: failedBatches.length > 0 ? failedBatches : undefined,
          failedBatchCount: failedBatches.length,
          success: true
        };
      });

      // Update user settings with the sync state
      logger.info("Step 5: Updating user settings with sync state");
      await step.run("update-sync-state", async () => {
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

        const syncTimestamp = new Date().toISOString();

        // Determine pagination state for next run
        const shouldSaveCursor = !importResult.reachedEnd && importResult.nextCursor;
        const isNowFullySynced = importResult.reachedEnd || syncType === 'incremental';

        // Merge existing settings with new state
        const updatedSettings = {
          settings: {
            ...(currentSettings?.settings || {}),
            integrations: {
              ...(currentSettings?.settings?.integrations || {}),
              readwise: {
                ...(currentSettings?.settings?.integrations?.readwise || {}),
                lastSyncTime: syncTimestamp,
                // Save pagination cursor if we haven't reached the end
                paginationCursor: shouldSaveCursor ? importResult.nextCursor : null,
                // Mark as fully synced if we reached the end or completed incremental
                isFullySynced: isNowFullySynced,
                // Update lastFullSyncTime when we complete a full sync (reached end)
                ...(importResult.reachedEnd && { lastFullSyncTime: syncTimestamp })
              }
            }
          }
        };

        logger.info(`Updating sync state - type: ${syncType}, lastSyncTime: ${syncTimestamp}`);
        logger.info(`Pagination: ${shouldSaveCursor ? 'saved cursor for next run' : 'no cursor (completed or incremental)'}`);
        logger.info(`Status: ${isNowFullySynced ? 'fully synced' : 'chunked sync in progress'}`);
        if (importResult.reachedEnd) {
          logger.info(`Completed full sync - setting lastFullSyncTime: ${syncTimestamp}`);
        }

        // Update settings
        const { error } = await supabase
          .from('user_settings')
          .update(updatedSettings)
          .eq('id', userId);

        if (error) {
          logger.error("Failed to update sync state", error);
          return { success: false };
        }

        return { success: true };
      });

      // Final log and return
      const hasFailures = importResult.failedBatchCount > 0;
      const isInProgress = !importResult.reachedEnd && importResult.nextCursor;
      
      let logMessage: string;
      if (hasFailures) {
        logMessage = "Highlights sync completed with partial failures";
      } else if (isInProgress) {
        logMessage = "Highlights chunk sync completed - will continue in next run";
      } else if (importResult.reachedEnd) {
        logMessage = "Highlights full sync completed successfully - all highlights synced";
      } else {
        logMessage = "Highlights sync completed successfully";
      }
      
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
        reachedEnd: importResult.reachedEnd,
        hasMoreToSync: isInProgress,
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
        reachedEnd: importResult.reachedEnd,
        hasMoreToSync: isInProgress,
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