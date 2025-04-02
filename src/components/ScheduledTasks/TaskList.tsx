import { ScheduledTask } from './types';

/**
 * List of available scheduled tasks
 */
export const availableTasks: ScheduledTask[] = [
  {
    id: "readwise-books-count",
    name: "Count Readwise Books",
    description: "Count the number of books in your Readwise account",
    isSchedulable: false, // Not schedulable yet
    triggerEndpoint: "/api/inngest/trigger-readwise",
    requiresApiKey: true,
    apiKeySource: "readwise"
  },
  {
    id: "readwise-books-import",
    name: "Import Readwise Books",
    description: "Import all your books from Readwise into the database",
    isSchedulable: false,
    triggerEndpoint: "/api/inngest/trigger-sync-books",
    requiresApiKey: true,
    apiKeySource: "readwise"
  },
  {
    id: "readwise-highlights-sync",
    name: "Sync Readwise Highlights",
    description: "Import highlights from your Readwise books into the database",
    isSchedulable: false,
    triggerEndpoint: "/api/inngest/trigger-sync-highlights",
    requiresApiKey: true,
    apiKeySource: "readwise"
  },
  {
    id: "migrate-highlight-tags",
    name: "Migrate Highlight Tags",
    description: "Convert legacy rw_tags from highlights to proper tags using the categorization system",
    isSchedulable: false,
    triggerEndpoint: "/api/inngest/trigger-migrate-tags",
    requiresApiKey: false
  },
  {
    id: "airtable-import",
    name: "Import from Airtable",
    description: "Import data from an Airtable table and create sparks with associated categories and tags",
    isSchedulable: false,
    triggerEndpoint: "/api/inngest/trigger-airtable-import",
    requiresApiKey: true,
    apiKeySource: "airtable"
  },
  // More tasks will be added in the future
]; 