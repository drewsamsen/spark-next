# Inngest Functions

This directory contains all the Inngest functions for background processing tasks in the application.

## Structure

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

## Function Naming Conventions

- All function variables should be named with the suffix `Fn`, e.g., `readwiseCountBooksFn`
- All function IDs should be kebab-case, e.g., `readwise-count-books`
- Each function should be in its own file, named in kebab-case matching the function ID
- Files should export the function variable, not the ID or event type

## Function Requirements

All functions should follow these conventions:

1. **Last Step Marker**: Include `isLastStep: true` in the final return value using the `markAsLastStep` utility
2. **Error Handling**: All functions should have proper error handling with descriptive messages
3. **Logging**: Use the built-in logger consistently for operational logs
4. **Step Names**: Use descriptive names for each step

## Adding New Functions

When creating a new function:

1. Create a new file in the appropriate domain directory
2. Export the function from the domain's index.ts file
3. Register the function in `src/app/api/inngest/route.ts`
4. Add the appropriate event type to `src/inngest/types.ts`

## Migration

This modular structure replaces the previous monolithic `inngest.config.ts` file. Use the migration helper script to track progress:

```
node scripts/migrate-inngest.js
```

## Utility Functions

### Function Conventions

- `markAsLastStep(result)`: Marks a function result as the final step
- `markAsError(result)`: Marks a function result as an error (with isLastStep)

### Readwise API

- `throttledReadwiseRequest()`: Makes rate-limited requests to the Readwise API
- `throttledReadwiseAuthRequest()`: Tests authentication with Readwise API 