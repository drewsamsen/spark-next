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

/**
 * Action to categorize a resource
 */
export interface CategorizationAction {
  id?: string;
  actionType: 'add_category' | 'add_tag' | 'create_category' | 'create_tag';
  resource?: Resource;
  categoryId?: string;
  tagId?: string;
  categoryName?: string;
  tagName?: string;
  createdResourceId?: string;
  status?: 'pending' | 'executed' | 'rejected' | 'reverted';
  executedAt?: Date;
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