import { Inngest } from "inngest";
import { databaseLoggerMiddleware } from "../lib/inngest-db-logger-middleware";

// Determine environment-specific app ID to prevent sync pollution
// Each environment gets its own Inngest app to avoid accumulating stale syncs
const getAppId = () => {
  if (process.env.VERCEL_ENV === "production") {
    return "spark-prod";
  }
  if (process.env.VERCEL_ENV === "preview") {
    // Use branch name for preview deployments to keep them isolated
    const branch = process.env.VERCEL_GIT_COMMIT_REF || "unknown";
    return `spark-preview-${branch}`;
  }
  // Local development
  return "spark-dev";
};

// Initialize Inngest with typed events
export const inngest = new Inngest({
  id: getAppId(),
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