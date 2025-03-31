import { serve } from "inngest/next";
import { inngest, 
  readwiseCountBooksFn,
  readwiseConnectionTestFn
} from "@/../inngest.config";

// Export the API routes for Inngest communication
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    readwiseCountBooksFn,
    readwiseConnectionTestFn
  ],
}); 