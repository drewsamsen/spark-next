/**
 * Database schema definition for type-safe database access
 */
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

/**
 * Define the structure of our user settings
 * 
 * @property theme - User's preferred theme
 * @property rightSidebar - Configuration for the right sidebar
 * @property leftSidebar - Configuration for the left sidebar
 * @property integrations - Configuration for external integrations
 */
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

/**
 * Default settings values for new users
 * These values are used when a user has no stored settings
 */
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

/**
 * Sidebar item interface for nested sidebars (Books, Sparks, etc.)
 * 
 * @property id - Unique identifier for the item
 * @property rwId - Optional Readwise ID for books
 * @property name - Display name of the item
 * @property color - Optional color for visual distinction
 * @property date - Optional formatted date for display
 * @property highlightsCount - Optional count of highlights
 */
export interface SidebarItem {
  id: string;
  rwId?: number;       // Optional - used for books to store the Readwise ID
  name: string;
  color?: string;      // Optional - used for Sparks
  date?: string;       // Optional - Format: "MMM 'YY" (e.g., "Mar '23")
  highlightsCount?: number; // Optional - Number of highlights
}

/**
 * Definition of spark category
 * 
 * @property id - Unique identifier for the category
 * @property name - Display name of the category
 */
export interface SparkCategory {
  id: string;
  name: string;
}

/**
 * Definition of spark tag
 * 
 * @property id - Unique identifier for the tag
 * @property name - Display name of the tag
 */
export interface SparkTag {
  id: string;
  name: string;
}

/**
 * Database model for a spark
 * Represents the raw database row structure
 * 
 * @property id - Unique identifier
 * @property user_id - The ID of the user who owns this spark
 * @property body - The content of the spark
 * @property todo_created_at - When the todo was created (if this is a todo)
 * @property todo_id - Reference to a todo item (if applicable)
 * @property md5_uid - MD5 hash for deduplication
 * @property created_at - Creation timestamp
 * @property updated_at - Last update timestamp
 */
export interface SparkModel {
  id: string;
  user_id: string;
  body: string;
  todo_created_at: string | null;
  todo_id: string | null;
  md5_uid: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Detailed spark with categories and tags
 */
export interface SparkWithRelations {
  id: string;
  user_id: string;
  body: string;
  todo_created_at: string | null;
  todo_id: string | null;
  md5_uid: string | null;
  created_at: string;
  updated_at: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
  tags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
}

/**
 * Spark domain model
 */
export interface SparkDomain {
  id: string;
  body: string;
  createdAt: string;
  todoCreatedAt: string | null;
  todoId: string | null;
  md5Uid: string | null;
  updatedAt: string;
  categories: SparkCategory[];
  tags: SparkTag[];
}

/**
 * Input to create a new spark
 */
export interface CreateSparkInput {
  body: string;
  todoCreatedAt?: string | null;
  todoId?: string | null;
  md5Uid?: string | null;
}

/**
 * Enhanced Spark item combining SidebarItem with SparkDetails
 */
export interface EnhancedSparkItem extends SidebarItem {
  details: SparkDomain;
}

/**
 * Definition of book category
 */
export interface BookCategory {
  id: string;
  name: string;
}

/**
 * Definition of book tag
 */
export interface BookTag {
  id: string;
  name: string;
}

/**
 * Database model for a book
 */
export interface BookModel {
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
}

/**
 * Detailed book with categories and tags
 */
export interface BookWithRelations extends BookModel {
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
  tags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
}

/**
 * Book domain model
 */
export interface BookDomain {
  id: string;
  rwId: number;
  title: string;
  author: string | null;
  category: string | null;
  source: string | null;
  numHighlights: number;
  lastHighlightAt: string | null;
  coverImageUrl: string | null;
  highlightsUrl: string | null;
  sourceUrl: string | null;
  documentNote: string | null;
  rwTags: string[] | null;
  categories: BookCategory[];
  tags: BookTag[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Basic book info for lists
 */
export interface BookBasicInfo {
  id: string;
  rwId: number;
  title: string;
  numHighlights: number;
  lastHighlightAt: string | null;
}

/**
 * Input to create a new book
 */
export interface CreateBookInput {
  rwId: number;
  rwTitle?: string | null;
  rwAuthor?: string | null;
  rwCategory?: string | null;
  rwSource?: string | null;
  rwNumHighlights?: number | null;
  rwLastHighlightAt?: string | null;
  rwUpdated?: string | null;
  rwCoverImageUrl?: string | null;
  rwHighlightsUrl?: string | null;
  rwSourceUrl?: string | null;
  rwAsin?: string | null;
  rwTags?: string[] | null;
  rwDocumentNote?: string | null;
}

/**
 * Enhanced Book item combining SidebarItem with BookDetails
 */
export interface EnhancedBookItem extends SidebarItem {
  details: BookDomain;
}

/**
 * Definition of highlight tag
 */
export interface HighlightTag {
  id: string;
  name: string;
}

/**
 * Definition of highlight category
 */
export interface HighlightCategory {
  id: string;
  name: string;
}

/**
 * Database model for a highlight
 */
export interface HighlightModel {
  id: string;
  user_id: string;
  book_id: string;
  rw_id: number;
  rw_text: string | null;
  rw_note: string | null;
  rw_location: string | null;
  rw_location_type: string | null;
  rw_highlighted_at: string | null;
  rw_url: string | null;
  rw_color: string | null;
  rw_tags: (string | { id: string; name: string })[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Detailed highlight with categories and tags
 */
export interface HighlightWithRelations extends HighlightModel {
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
  tags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
}

/**
 * Highlight domain model
 */
export interface HighlightDomain {
  id: string;
  bookId: string;
  rwId: number;
  text: string;
  note: string | null;
  location: string | null;
  locationType: string | null;
  highlightedAt: string | null;
  url: string | null;
  color: string | null;
  rwTags: (string | { id: string; name: string })[] | null;
  categories: HighlightCategory[];
  tags: HighlightTag[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Input to create a new highlight
 */
export interface CreateHighlightInput {
  bookId: string;
  rwId: number;
  rwText: string;
  rwNote?: string | null;
  rwLocation?: string | null;
  rwLocationType?: string | null;
  rwHighlightedAt?: string | null;
  rwUrl?: string | null;
  rwColor?: string | null;
  rwTags?: (string | { id: string; name: string })[] | null;
}

/**
 * User model from Supabase auth
 */
export interface UserModel {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Authenticated user interface
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Type for auth user data
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Type for auth session data
 */
export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

/**
 * Interface for authentication result
 */
export interface AuthResult {
  user: AuthenticatedUser | null;
  error: any | null;
}

/**
 * Database model for a category
 */
export interface CategoryModel {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Category model with usage count
 */
export interface CategoryModelWithUsage extends CategoryModel {
  usage_count: number;
}

/**
 * Category domain model
 */
export interface CategoryDomain {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Domain model for a category with usage count
 */
export interface CategoryDomainWithUsage extends CategoryDomain {
  usageCount: number;
}

/**
 * Input to create a new category
 */
export interface CreateCategoryInput {
  name: string;
}

/**
 * Database model for a tag
 */
export interface TagModel {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Tag model with usage count
 */
export interface TagModelWithUsage extends TagModel {
  usage_count: number;
}

/**
 * Domain model for a tag
 */
export interface TagDomain {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Domain model for a tag with usage count
 */
export interface TagDomainWithUsage extends TagDomain {
  usageCount: number;
}

/**
 * Input to create a new tag
 */
export interface CreateTagInput {
  name: string;
}

/**
 * Interface for Airtable integration settings
 */
export interface AirtableSettings {
  apiKey: string | null;
  baseId: string | null;
  tableId: string | null;
  isConnected?: boolean;
  lastImported?: string | null;
}

/**
 * Interface for Readwise integration settings
 */
export interface ReadwiseSettings {
  accessToken: string | null;
  lastSync: string | null;
  isConnected?: boolean;
}

/**
 * Type for Readwise connection test data
 */
export interface ReadwiseConnectionTestData {
  userId: string;
  apiKey: string;
}

/**
 * Type for Readwise sync data
 */
export interface ReadwiseSyncData {
  userId: string;
  apiKey: string;
  fullSync?: boolean;
}

/**
 * Interface for an integration in the system
 */
export interface IntegrationModel {
  type: 'readwise' | 'airtable';
  name: string;
  isConnected: boolean;
  settings: ReadwiseSettings | AirtableSettings;
}

/**
 * Status type for function logs
 * Represents the possible states of a function execution
 */
export type FunctionLogStatus = 'started' | 'completed' | 'failed';

/**
 * Status type for categorization jobs
 * Represents the possible states of a categorization job
 */
export type CategorizationJobStatus = 'pending' | 'approved' | 'rejected';

/**
 * Status type for integration connection
 * Represents the possible states of an integration connection
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

/**
 * Action type for categorization actions
 * Represents the possible actions that can be performed in a categorization job
 */
export type CategorizationActionType = 'add_category' | 'add_tag' | 'create_category' | 'create_tag';

/**
 * Source type for categorization jobs
 * Represents the origin of a categorization job
 */
export type CategorizationJobSource = 'ai' | 'user' | 'system';

/**
 * Database model for a function log
 * Represents the execution record of a background function
 * 
 * @property id - Unique identifier
 * @property function_name - The name of the function that was executed
 * @property function_id - Identifier for the function definition
 * @property run_id - Execution run identifier
 * @property status - Current status of the execution
 * @property started_at - When the function started executing
 * @property completed_at - When the function completed (or null if not completed)
 * @property duration_ms - How long the function took to execute in milliseconds
 * @property input_params - The parameters passed to the function
 * @property result_data - The result returned by the function
 * @property error_message - Error message if the function failed
 * @property error_stack - Stack trace if the function failed
 * @property created_at - Record creation timestamp
 * @property updated_at - Record update timestamp
 * @property user_id - The ID of the user who triggered the function
 */
export interface FunctionLogModel {
  id: string;
  function_name: string;
  function_id: string;
  run_id: string;
  status: FunctionLogStatus;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  input_params: any;
  result_data: any;
  error_message: string | null;
  error_stack: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

/**
 * Filter interface for querying function logs
 */
export interface FunctionLogsFilter {
  function_name?: string;
  status?: FunctionLogStatus;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Standard API response interface
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Paginated API response interface
 */
export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
  status: number;
}

/**
 * Function logs API response interface
 */
export interface FunctionLogsApiResponse {
  logs: FunctionLogModel[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
