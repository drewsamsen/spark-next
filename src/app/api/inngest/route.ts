import { serve } from "inngest/next";
import { inngest, 
  readwiseCountBooksFn,
  readwiseConnectionTestFn,
  readwiseSyncBooksFn,
  readwiseSyncHighlightsFn,
  migrateHighlightTagsFn
} from "@/../inngest.config";

// Export the API routes for Inngest communication
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    readwiseCountBooksFn,
    readwiseConnectionTestFn,
    readwiseSyncBooksFn,
    readwiseSyncHighlightsFn,
    migrateHighlightTagsFn
  ],
});

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic'; 