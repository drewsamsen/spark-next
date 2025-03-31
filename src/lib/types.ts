export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          settings: UserSettings;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          settings?: UserSettings;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          settings?: UserSettings;
          created_at?: string;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          user_id: string;
          rw_id: number;
          rw_title: string | null;
          rw_author: string | null;
          rw_category: string | null;
          rw_source: string | null;
          rw_num_highlights: number | null;
          rw_last_highlight_at: string | null;
          rw_updated: string | null;
          rw_cover_image_url: string | null;
          rw_highlights_url: string | null;
          rw_source_url: string | null;
          rw_asin: string | null;
          rw_tags: string[] | null;
          rw_document_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rw_id: number;
          rw_title?: string | null;
          rw_author?: string | null;
          rw_category?: string | null;
          rw_source?: string | null;
          rw_num_highlights?: number | null;
          rw_last_highlight_at?: string | null;
          rw_updated?: string | null;
          rw_cover_image_url?: string | null;
          rw_highlights_url?: string | null;
          rw_source_url?: string | null;
          rw_asin?: string | null;
          rw_tags?: string[] | null;
          rw_document_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rw_id?: number;
          rw_title?: string | null;
          rw_author?: string | null;
          rw_category?: string | null;
          rw_source?: string | null;
          rw_num_highlights?: number | null;
          rw_last_highlight_at?: string | null;
          rw_updated?: string | null;
          rw_cover_image_url?: string | null;
          rw_highlights_url?: string | null;
          rw_source_url?: string | null;
          rw_asin?: string | null;
          rw_tags?: string[] | null;
          rw_document_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_tables_in_schema: {
        Args: {
          schema_name: string;
        };
        Returns: string[];
      };
    };
  };
};

// Define the structure of our user settings
export interface UserSettings {
  theme?: 'light' | 'dark';
  rightSidebar?: {
    width: number;
  };
  leftSidebar?: {
    width: number;
  };
  integrations?: {
    readwise?: {
      apiKey?: string;
      lastSyncTime?: string;
      bookCount?: number;
    }
  };
  // Additional settings can be added here in the future
}

// Default settings values
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'light',
  rightSidebar: {
    width: 384 // Default width (96px * 4)
  },
  leftSidebar: {
    width: 360 // Default width
  },
  integrations: {
    readwise: {
      apiKey: '',
      lastSyncTime: '',
      bookCount: 0
    }
  }
};
