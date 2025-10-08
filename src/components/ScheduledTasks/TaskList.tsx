import { ScheduledTask } from './types';

/**
 * List of available scheduled tasks
 */
export const availableTasks: ScheduledTask[] = [
  {
    id: "readwise-books-count",
    name: "Count Readwise Books",
    description: "Count the number of books in your Readwise account",
    isSchedulable: false, // Just a counter, not useful to schedule
    triggerEndpoint: "/api/inngest/trigger-readwise",
    requiresApiKey: true,
    apiKeySource: "readwise"
  },
  {
    id: "readwise-books-import",
    name: "Import Readwise Books",
    description: "Import all your books from Readwise into the database",
    isSchedulable: true,
    triggerEndpoint: "/api/inngest/trigger-sync-books",
    requiresApiKey: true,
    apiKeySource: "readwise"
  },
  {
    id: "readwise-highlights-sync",
    name: "Sync Readwise Highlights",
    description: "Import highlights from your Readwise books into the database",
    isSchedulable: true,
    triggerEndpoint: "/api/inngest/trigger-sync-highlights",
    requiresApiKey: true,
    apiKeySource: "readwise"
  },
  {
    id: "migrate-highlight-tags",
    name: "Migrate Highlight Tags",
    description: "Convert legacy rw_tags from highlights to proper tags using the categorization system",
    isSchedulable: false, // One-time migration task
    triggerEndpoint: "/api/inngest/trigger-migrate-tags",
    requiresApiKey: false
  },
  {
    id: "airtable-import-sparks",
    name: "Import Sparks from Airtable",
    description: "Import sparks from Airtable Thoughts Manager and create them in Supabase with categories and tags",
    isSchedulable: true,
    triggerEndpoint: "/api/inngest/trigger-airtable-import",
    requiresApiKey: true,
    apiKeySource: "airtable"
  },
  {
    id: "tag-random-highlights",
    name: "Tag Random Highlights",
    description: "Select 3 random highlights and create a context automation to tag them with 'automation-test'",
    isSchedulable: false, // Test/demo task, not for production scheduling
    triggerEndpoint: "/api/inngest/trigger-tag-random-highlights",
    requiresApiKey: false
  },
  {
    id: "categorize-random-highlights",
    name: "Categorize Random Highlights",
    description: "Select 5 random highlights and create a context automation to categorize them with 'automation-test'",
    isSchedulable: false, // Test/demo task, not for production scheduling
    triggerEndpoint: "/api/inngest/trigger-categorize-random-highlights",
    requiresApiKey: false
  },
  // More tasks will be added in the future
]; 