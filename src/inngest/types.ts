// Define event types for better type safety
export type AppEvents = {
  "readwise/count-books": {
    data: {
      userId: string;
      apiKey: string;
    };
  };
  "readwise/test-connection": {
    data: {
      userId: string;
      apiKey: string;
    }
  };
  "readwise/sync-books": {
    data: {
      userId: string;
      apiKey: string;
    }
  };
  "readwise/sync-highlights": {
    data: {
      userId: string;
      apiKey: string;
    }
  };
  "tags/migrate-highlight-tags": {
    data: {
      userId: string;
    }
  };
  "airtable/import-sparks": {
    data: {
      userId: string;
      apiKey: string;
      baseId: string;
      tableId: string;
    }
  };
};

// Readwise specific types
export interface BooksMapResult {
  booksMap: Map<number, { id: string, rwUpdated: Date }>;
  success: boolean;
} 