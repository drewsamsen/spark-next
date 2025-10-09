import { inngest } from "../../client";
import { markAsError, markAsLastStep } from "../../utils/function-conventions";
import { createClient } from "@supabase/supabase-js";
import { generateEmbeddingBatch } from "@/lib/openai";

/**
 * Batch size for processing highlights at a time
 * This can be adjusted based on performance and cost considerations
 */
const BATCH_SIZE = 250;

/**
 * OpenAI batch size - sending smaller batches for better reliability
 * We'll chunk our highlights into this size when calling the API
 */
const OPENAI_BATCH_SIZE = 50;

/**
 * Inngest function to generate embeddings for highlights
 * 
 * This function is triggered by the scheduled tasks system and processes
 * a batch of highlights that don't have embeddings yet or need to be updated.
 * 
 * PROCESS:
 * 1. Fetch highlights without embeddings (or outdated embeddings)
 * 2. Generate embeddings using OpenAI API
 * 3. Update the database with the generated embeddings
 * 4. Log progress and any errors
 */
export const generateHighlightEmbeddingsFn = inngest.createFunction(
  { id: "embeddings/generate-highlight-embeddings" },
  { event: "embeddings/generate-highlight-embeddings" },
  async ({ event, step, logger }) => {
    const { userId } = event.data;

    logger.info("Starting highlight embeddings generation", { userId });

    if (!userId) {
      logger.error("Missing user ID");
      return markAsError({
        success: false,
        error: "Missing user ID",
        processed: 0,
        failed: 0
      });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logger.error("OPENAI_API_KEY environment variable not set");
      return markAsError({
        success: false,
        error: "OPENAI_API_KEY not configured",
        processed: 0,
        failed: 0
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
        processed: 0,
        failed: 0
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // Step 1: Fetch highlights that need embeddings
      const highlightsResult = await step.run("fetch-highlights-without-embeddings", async () => {
        logger.info(`Fetching up to ${BATCH_SIZE} highlights without embeddings for user ${userId}`);

        // Fetch highlights where embedding is null OR embedding_updated_at is null
        // (both indicate the highlight needs to be vectorized)
        const { data, error } = await supabase
          .from('highlights')
          .select('id, rw_text, updated_at, embedding_updated_at')
          .eq('user_id', userId)
          .is('embedding', null)
          .not('rw_text', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(BATCH_SIZE);

        if (error) {
          logger.error("Error fetching highlights", { error });
          throw error;
        }

        if (!data || data.length === 0) {
          logger.info("No highlights found that need embeddings");
          return { highlights: [] };
        }

        logger.info(`Found ${data.length} highlights to process`);
        return { highlights: data };
      });

      // If no highlights to process, return early
      if (highlightsResult.highlights.length === 0) {
        return markAsLastStep({
          success: true,
          message: "No highlights to process",
          processed: 0,
          failed: 0
        });
      }

      // Step 2: Process embeddings in chunks (generate + update DB immediately)
      // This avoids returning large embedding arrays which exceed Inngest's step output limit
      const totalChunks = Math.ceil(highlightsResult.highlights.length / OPENAI_BATCH_SIZE);
      let totalProcessed = 0;
      let totalFailed = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunkResult = await step.run(`process-chunk-${chunkIndex + 1}`, async () => {
          const startIdx = chunkIndex * OPENAI_BATCH_SIZE;
          const endIdx = Math.min(startIdx + OPENAI_BATCH_SIZE, highlightsResult.highlights.length);
          const highlightChunk = highlightsResult.highlights.slice(startIdx, endIdx);
          
          logger.info(`Processing chunk ${chunkIndex + 1}/${totalChunks} (${highlightChunk.length} highlights)`);

          // Generate embeddings for this chunk
          const texts = highlightChunk.map(h => h.rw_text || '');
          const embeddings = await generateEmbeddingBatch(texts);
          
          logger.info(`Generated ${embeddings.length} embeddings for chunk ${chunkIndex + 1}`);

          // Update database immediately with generated embeddings
          let processed = 0;
          let failed = 0;
          const now = new Date().toISOString();

          for (let i = 0; i < highlightChunk.length; i++) {
            const highlight = highlightChunk[i];
            const embedding = embeddings[i];

            try {
              // Convert embedding array to pgvector format
              const embeddingString = `[${embedding.join(',')}]`;

              const { error } = await supabase
                .from('highlights')
                .update({
                  embedding: embeddingString,
                  embedding_updated_at: now
                })
                .eq('id', highlight.id)
                .eq('user_id', userId);

              if (error) {
                logger.error(`Error updating embedding for highlight ${highlight.id}`, { error });
                failed++;
              } else {
                processed++;
                logger.debug(`Successfully updated embedding for highlight ${highlight.id}`);
              }
            } catch (error) {
              logger.error(`Error processing highlight ${highlight.id}`, { error });
              failed++;
            }
          }

          logger.info(`Chunk ${chunkIndex + 1} complete: ${processed} processed, ${failed} failed`);

          // Return only counts, not the actual embeddings (to avoid step output size limit)
          return { processed, failed };
        });

        totalProcessed += chunkResult.processed;
        totalFailed += chunkResult.failed;
      }

      const updateResult = { processed: totalProcessed, failed: totalFailed };

      // Return final result
      return markAsLastStep({
        success: true,
        message: `Successfully processed ${updateResult.processed} highlights, ${updateResult.failed} failed`,
        processed: updateResult.processed,
        failed: updateResult.failed,
        totalHighlights: highlightsResult.highlights.length
      });

    } catch (error) {
      logger.error("Error in generate-highlight-embeddings function", { error });
      return markAsError({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processed: 0,
        failed: 0
      });
    }
  }
);

