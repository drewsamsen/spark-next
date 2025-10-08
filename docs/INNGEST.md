# Inngest Integration Documentation

## Overview

This project uses [Inngest](https://www.inngest.com/) for background jobs and scheduled tasks. Inngest allows us to run reliable, scalable background processing with retries, delays, and scheduled functions.

## Architecture

### Environment-Specific App IDs

The application uses **environment-specific Inngest app IDs** to ensure isolation between environments and prevent sync pollution:

```typescript
// Production environment
App ID: "spark-production"

// Preview deployments (per branch)
App ID: "spark-preview-{branch-name}"

// Local development
App ID: "spark-dev"
```

**Why This Matters:**
- Each app ID creates a separate Inngest app in the dashboard
- Prevents syncs from accumulating across environments
- Ensures cron jobs only run in production
- Preview deployments don't interfere with production functions
- Makes debugging easier by isolating environments

**Implementation:**
See `src/inngest/client.ts` for the app ID logic based on `VERCEL_ENV`.

## Setup

### Prerequisites

- Node.js 16+
- Next.js project
- Inngest account (free tier available)

### Environment Variables

Add the following to your `.env.local` file:

```
# Inngest Configuration
INNGEST_EVENT_KEY=your_event_key_here
INNGEST_SIGNING_KEY=your_signing_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Used in API callbacks
```

Get these values from the Inngest dashboard after creating a project.

## Development Workflow

### 1. Start the Next.js Development Server

```bash
npm run dev
```

### 2. Start Inngest Dev Server (in a separate terminal)

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

This creates a local development environment for Inngest that:
- Discovers your functions automatically
- Provides a UI to test and debug events
- Shows logs and execution details
- Allows manual triggering of events and functions

Visit `http://localhost:8288` to access the Inngest Dev UI.

## Project Structure

```
└── src/
    ├── inngest/               # Modular Inngest configuration
    │   ├── client.ts          # Inngest client configuration
    │   ├── index.ts           # Main exports
    │   ├── types.ts           # Common types and interfaces
    │   ├── functions/         # Function definitions by domain
    │   │   ├── readwise/      # Readwise-related functions
    │   │   ├── airtable/      # Airtable-related functions
    │   │   └── tags/          # Tag-related functions
    │   └── utils/             # Utility functions
    │       ├── readwise-api.ts # API-specific utilities
    │       └── function-conventions.ts # Common function patterns
    └── app/
        └── api/
            ├── inngest/
            │   ├── route.ts                # API route handler for Inngest
            │   └── trigger-readwise/       # Endpoint to trigger specific events
            │       └── route.ts
            └── readwise/
                └── route.ts                # Handles updates from Inngest jobs
```

## Creating Functions

Functions are defined in domain-specific files under the `src/inngest/functions/` directory. Each function should be in its own file and exported with a name that includes the `Fn` suffix.

Example:

```typescript
// In src/inngest/functions/domain/my-function.ts
import { inngest } from "../../client";
import { markAsLastStep } from "../../utils/function-conventions";

// Event-triggered function
export const domainActionFn = inngest.createFunction(
  { id: "domain-action" },
  { event: "domain/action" },
  async ({ event, step, logger }) => {
    const { userId } = event.data;
    
    logger.info("Starting domain action", { userId });
    
    // Implementation...
    
    return markAsLastStep({
      success: true
    });
  }
);
```

Then export it from the domain's index.ts:
```typescript
// In src/inngest/functions/domain/index.ts
export { domainActionFn } from './my-function';
```

And register it in the route handler:
```typescript
// In src/app/api/inngest/route.ts
import { 
  inngest,
  domainActionFn
} from "@/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    domainActionFn
  ],
});
```

## Triggering Events

### Programmatically

```typescript
// From server-side code
await inngest.send({
  name: "readwise/fetch-books",
  data: {
    userId: "user-123",
    apiKey: "api-key-xyz"
  }
});
```

### From API Routes

Create API routes to trigger events from client components:

```typescript
// In client component
const triggerSync = async () => {
  await fetch("/api/inngest/trigger-readwise", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      userId: "user-123",
      apiKey: "api-key-xyz"
    })
  });
};
```

### Manually in Development

1. Open the Inngest Dev UI at `http://localhost:8288`
2. Click on the function you want to test
3. Click "Test Function"
4. Enter test event data and run

## Scheduled Tasks

We have the following scheduled tasks:

- **Daily Readwise Sync** (`readwise-daily-sync`): Runs at 3:00 AM UTC daily to synchronize all users' Readwise book counts

To test scheduled tasks:
1. Use the Inngest Dev UI
2. Use the manual trigger API endpoint: `POST /api/inngest/trigger-schedule`

## Event Types

Our typed events provide better type safety. See `AppEvents` in `src/inngest/types.ts`:

```typescript
export type AppEvents = {
  "domain/action": {
    data: {
      userId: string;
      // other parameters...
    };
  };
  // Other events...
};
```

## Production Deployment

For production:

1. Create a production environment in Inngest Cloud
2. Set environment variables on your hosting platform
3. Deploy your Next.js application
4. Configure Inngest to point to your production API endpoint

## Troubleshooting

### Common Issues

- **Function not registered**: Ensure your function is exported in your domain directory and included in the `functions` array in `src/app/api/inngest/route.ts`
- **Events not triggering**: Check network requests in browser dev tools for errors
- **"Cannot find module" errors**: These are related to Node.js protocol handling - ensure you're using the webpack configuration in `next.config.ts`

### Debugging

1. Check Inngest Dev UI logs
2. Look for errors in your Next.js server logs
3. Use `step.run()` with descriptive names to see exactly where execution fails

## Best Practices

1. **Idempotent functions**: Design functions to be safely retried without side effects
2. **Clear naming**: Use descriptive event names following the `domain/action` pattern
3. **Graceful error handling**: Always wrap code in try/catch blocks
4. **Rate limiting**: Add delays between API calls for external services
5. **Short steps**: Break long operations into smaller steps for better reliability

## Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Next.js App Router + Inngest](https://www.inngest.com/docs/sdk/serve-functions/nextjs-app)
- [Inngest Discord](https://discord.gg/inngest)

# Inngest Configuration

Inngest is configured in a modular way within the `/src/inngest` directory:

```
src/inngest/
├── client.ts              # Inngest client configuration
├── index.ts               # Main exports
├── types.ts               # Common types
├── functions/             # Function definitions organized by domain
│   ├── readwise/          # Readwise-related functions
│   ├── airtable/          # Airtable-related functions
│   └── tags/              # Tag-related functions
└── utils/                 # Utility functions
    ├── readwise-api.ts    # Readwise API helpers
    └── function-conventions.ts  # Common patterns for functions
```

## Adding a New Function

When creating a new function:

1. Create a new file in the appropriate domain directory under `src/inngest/functions/`
2. Export the function from the domain's index.ts file
3. Register the function in `src/app/api/inngest/route.ts`
4. Add the appropriate event type to `src/inngest/types.ts`

Functions are defined in domain-specific files. Example:

```typescript
import { inngest } from "../../client";
import { markAsLastStep } from "../../utils/function-conventions";

export const myNewFunctionFn = inngest.createFunction(
  { id: "my-new-function" },
  { event: "domain/event-name" },
  async ({ event, step, logger }) => {
    const { userId } = event.data;
    
    logger.info("Starting my new function", { userId });
    
    // Function implementation here...
    
    return markAsLastStep({ 
      success: true 
    });
  }
);
```

## Function Conventions

All Inngest functions MUST follow these conventions:

1. Use the `markAsLastStep` utility to add `isLastStep: true` in the final return value
2. Use the `markAsError` utility for error responses
3. Follow consistent naming patterns: `domainActionFn` (e.g., `readwiseCountBooksFn`)
4. Use consistent step naming for ease of debugging 