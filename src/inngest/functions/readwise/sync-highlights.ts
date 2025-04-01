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
        imported: 0,
        updated: 0,
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
        imported: 0,
        updated: 0,
        existingHighlights: 0
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // Step 1: Get all existing highlights for this user once
      type HighlightInfo = { id: string, rwUpdated: Date };
      type HighlightMap = Map<string, HighlightInfo>;

      const fetchResult = await step.run("fetch-existing-highlights", async () => {
        logger.info(`Fetching existing highlights for user ${userId} from database`);

        const { data, error } = await supabase
          .from('highlights')
          .select('id, rw_id, rw_updated')
          .eq('user_id', userId);

        if (error) {
          logger.error("Error fetching existing highlights:", error);
          throw error;
        }

        // Maps don't serialize well in Inngest steps, so return raw data
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
          imported: 0,
          updated: 0,
          existingHighlights: 0
        });
      }

      // Track the number of existing highlights
      const existingHighlightsCount = fetchResult.highlightsData.length;
      logger.info(`Total highlights in Supabase: ${existingHighlightsCount}`);

      // Build lookup map
      logger.info("Step 2: Creating lookup map from existing highlights");
      const highlightsMap = new Map<string, HighlightInfo>();
      for (const highlight of fetchResult.highlightsData) {
        highlightsMap.set(highlight.rw_id.toString(), {
          id: highlight.id,
          rwUpdated: new Date(highlight.rw_updated)
        });
      }

      logger.info(`Created lookup map with ${highlightsMap.size} highlights`);

      // Step 3: Get the books first to create a map of book ids
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
          imported: 0,
          updated: 0,
          existingHighlights: existingHighlightsCount
        });
      }

      // Reconstruct the bookMap from the object
      const bookMap = new Map(Object.entries(booksResult.bookMap).map(([k, v]) => [Number(k), v]));

      // Step 4: Import highlights from Readwise API with batch processing
      logger.info("Step 3: Starting to import highlights from Readwise");
      const importResult = await step.run("import-highlights-from-readwise", async () => {
        logger.info(`Importing Readwise highlights for user ${userId}`);

        const readwiseUrl = "https://readwise.io/api/v2/highlights/";

        let nextUrl = readwiseUrl;
        let highlightsToInsert = [];
        let highlightsToUpdate = [];
        let totalReadwiseHighlights = 0;
        let page = 1;
        let highlightsWithoutBooks = 0;

        logger.info(`Making first request to Readwise API: ${readwiseUrl}`);
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

              // Check if this highlight already exists in our database
              const existingHighlight = highlightsMap.get(highlight.id.toString());

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
                    id: existingHighlight.id // Include id for the update operation
                  });
                }
              }
            }

            logger.info(`Page ${page}: Processed ${highlights.length} highlights. Cumulative totals - To insert: ${highlightsToInsert.length}, To update: ${highlightsToUpdate.length}, Without books: ${highlightsWithoutBooks}`);

            // Check if there's another page
            nextUrl = data.next || null;
            page++;

            // Safety check to prevent infinite loops
            if (page > 100) {
              logger.warn("Reached 100 pages - stopping to prevent potential infinite loop");
              break;
            }
          } catch (error) {
            logger.error(`Error processing Readwise API highlights page ${page}:`, error);
            throw error;
          }
        }

        logger.info(`Finished processing all highlights. Ready to insert: ${highlightsToInsert.length}, Ready to update: ${highlightsToUpdate.length}, Without books: ${highlightsWithoutBooks}`);

        // Execute batch operations
        let insertedCount = 0;
        let updatedCount = 0;

        logger.info("Starting database operations for highlight insertion/updates");

        // Insert new highlights in batches of 100
        if (highlightsToInsert.length > 0) {
          logger.info(`Beginning insertion of ${highlightsToInsert.length} highlights`);
          // Process in smaller batches to avoid hitting size limits
          const batchSize = 100;
          for (let i = 0; i < highlightsToInsert.length; i += batchSize) {
            const batch = highlightsToInsert.slice(i, i + batchSize);
            logger.info(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(highlightsToInsert.length/batchSize)}: ${batch.length} highlights`);

            const { error: insertError } = await supabase
              .from('highlights')
              .insert(batch);

            if (insertError) {
              logger.error("Error inserting highlights batch:", insertError);
            } else {
              insertedCount += batch.length;
              logger.info(`Successfully inserted batch: ${batch.length} highlights`);
            }
          }
        } else {
          logger.info("No new highlights to insert");
        }

        // Update existing highlights in batches of 100
        if (highlightsToUpdate.length > 0) {
          logger.info(`Beginning update of ${highlightsToUpdate.length} highlights`);
          // Process in smaller batches
          const batchSize = 100;
          for (let i = 0; i < highlightsToUpdate.length; i += batchSize) {
            const batch = highlightsToUpdate.slice(i, i + batchSize);
            logger.info(`Updating batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(highlightsToUpdate.length/batchSize)}: ${batch.length} highlights`);

            // Update each highlight in the batch
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
        } else {
          logger.info("No highlights to update");
        }

        logger.info(`Completed database operations. Inserted: ${insertedCount}, Updated: ${updatedCount}`);

        return {
          imported: insertedCount,
          updated: updatedCount,
          totalHighlights: totalReadwiseHighlights,
          withoutBooks: highlightsWithoutBooks,
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

        return { success: true };
      });

      // Final log and return
      logger.info("Highlights sync completed successfully", {
        totalHighlights: importResult.totalHighlights,
        existingHighlights: existingHighlightsCount,
        imported: importResult.imported,
        updated: importResult.updated,
        withoutBooks: importResult.withoutBooks
      });

      return markAsLastStep({
        success: true,
        totalHighlights: importResult.totalHighlights,
        existingHighlights: existingHighlightsCount,
        imported: importResult.imported,
        updated: importResult.updated,
        withoutBooks: importResult.withoutBooks
      });
    } catch (error) {
      logger.error("Error in Readwise sync highlights function:", error);
      return markAsError({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        totalHighlights: 0,
        imported: 0,
        updated: 0,
        existingHighlights: 0
      });
    }
  }
); 