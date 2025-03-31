# Inngest Integration Documentation

## Overview

This project uses [Inngest](https://www.inngest.com/) for background jobs and scheduled tasks. Inngest allows us to run reliable, scalable background processing with retries, delays, and scheduled functions.

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
    ├── inngest.config.ts    # Main Inngest configuration
    ├── lib/
    │   └── inngest.ts       # Utility functions for Inngest
    └── app/
        └── api/
            ├── inngest/
            │   ├── route.ts               # API route handler for Inngest
            │   └── trigger-readwise/     # Endpoint to trigger specific events
            │       └── route.ts
            └── readwise/
                └── route.ts              # Handles updates from Inngest jobs
```

## Creating Functions

Functions are defined in `inngest.config.ts`. Example:

```typescript
// Event-triggered function
export const readwiseFetchBooksFn = inngest.createFunction(
  { id: "readwise-fetch-books" },
  { event: "readwise/fetch-books" },
  async ({ event, step }) => {
    // Implementation
  }
);

// Scheduled function (cron)
export const readwiseDailySyncFn = inngest.createFunction(
  { id: "readwise-daily-sync" },
  { cron: "0 3 * * *" }, // Runs at 3:00 AM UTC daily
  async ({ step }) => {
    // Implementation
  }
);
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

Our typed events provide better type safety. See `AppEvents` in `inngest.config.ts`:

```typescript
export type AppEvents = {
  "readwise/fetch-books": {
    data: {
      userId: string;
      apiKey: string;
    };
  };
  "readwise/daily-sync": {
    data: {
      timestamp: string;
    }
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

- **Function not registered**: Ensure your function is exported in `inngest.config.ts` and included in the `functions` array in `src/app/api/inngest/route.ts`
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