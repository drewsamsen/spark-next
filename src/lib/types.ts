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
  }
};
