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
  scheduledTasksManualFn,
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
    // Only register cron in production environment to avoid duplicate runs from:
    // - Preview deployments (Vercel creates separate deployments for PRs/branches)
    // - Local development when connected to prod DB
    ...(process.env.VERCEL_ENV === 'production' ? [scheduledTasksCronFn] : []),
    
    // Manual trigger for scheduled tasks (available in all environments for debugging)
    scheduledTasksManualFn,
    
    // Automation functions
    tagRandomHighlights,
    categorizeRandomHighlights
  ],
});

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic'; 