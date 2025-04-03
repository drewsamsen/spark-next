/**
 * Categorization System Types
 */

// Resource types supported by our categorization system
export type ResourceType = 'book' | 'highlight' | 'spark';

// A generic interface for any categorizable resource
export interface Resource {
  id: string;
  type: ResourceType;
  userId: string;
}

// Category entity
export interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Category with usage count
 */
export interface CategoryWithUsage extends Category {
  usageCount: number;
}

// Tag entity
export interface Tag {
  id: string;
  name: string;
}

/**
 * Tag with usage count
 */
export interface TagWithUsage extends Tag {
  usageCount: number;
}

// Categorization job
export interface CategorizationJob {
  id?: string;
  userId: string;
  name: string;
  source: 'ai' | 'user' | 'system';
  status?: 'pending' | 'approved' | 'rejected';
  actions: CategorizationAction[];
  createdAt?: Date;
}

// Individual action within a job
export interface CategorizationAction {
  id?: string;
  actionType: 'add_category' | 'add_tag' | 'create_category' | 'create_tag';
  resource?: Resource;  // Optional for creation actions
  categoryId?: string;  // Used for add_category
  tagId?: string;       // Used for add_tag
  categoryName?: string; // Used for create_category
  tagName?: string;     // Used for create_tag
  createdResourceId?: string; // Populated after creation
}

// Result of a categorization operation
export interface CategorizationResult {
  success: boolean;
  jobId?: string;
  error?: string;
  createdResources?: {
    categories?: Category[];
    tags?: Tag[];
  };
} 