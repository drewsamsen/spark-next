import { serve } from "inngest/next";
import { 
  inngest, 
  readwiseCountBooksFn,
  readwiseConnectionTestFn,
  readwiseSyncBooksFn,
  readwiseSyncHighlightsFn,
  migrateHighlightTagsFn,
  airtableImportSparksFn,
  scheduledTasksCronFn,
  tagRandomHighlights,
  categorizeRandomHighlights
} from "@/inngest";

// Export the API routes for Inngest communication
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Readwise functions
    readwiseCountBooksFn,
    readwiseConnectionTestFn,
    readwiseSyncBooksFn,
    readwiseSyncHighlightsFn,
    
    // Tags functions
    migrateHighlightTagsFn,
    
    // Airtable functions
    airtableImportSparksFn,
    
    // Scheduled cron functions
    // Skip cron when running local dev with prod DB to avoid duplicate runs
    ...(process.env.NEXT_PUBLIC_USING_PROD_DB !== 'true' ? [scheduledTasksCronFn] : []),
    
    // Automation functions
    tagRandomHighlights,
    categorizeRandomHighlights
  ],
});

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic'; 