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
      sparks: {
        Row: {
          id: string;
          user_id: string;
          body: string;
          todo_created_at: string | null;
          todo_id: string | null;
          md5_uid: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          body: string;
          todo_created_at?: string | null;
          todo_id?: string | null;
          md5_uid?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          body?: string;
          todo_created_at?: string | null;
          todo_id?: string | null;
          md5_uid?: string | null;
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
      isConnected?: boolean;
    },
    airtable?: {
      apiKey?: string; // This is actually a Personal Access Token (API keys deprecated Feb 2024)
      baseId?: string;
      tableId?: string;
      isConnected?: boolean;
      lastImported?: string;
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
      bookCount: 0,
      isConnected: false
    },
    airtable: {
      apiKey: '',
      baseId: '',
      tableId: '',
      isConnected: false,
      lastImported: ''
    }
  }
};

// Sidebar item interface for nested sidebars (Books, Sparks, etc.)
export interface SidebarItem {
  id: string;
  rwId?: number;       // Optional - used for books to store the Readwise ID
  name: string;
  color?: string;      // Optional - used for Sparks
  date?: string;       // Optional - Format: "MMM 'YY" (e.g., "Mar '23")
  highlightsCount?: number; // Optional - Number of highlights
}
