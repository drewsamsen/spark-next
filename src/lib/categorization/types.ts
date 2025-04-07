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

// Categorization automation
export interface CategorizationAutomation {
  id?: string;
  userId: string;
  name: string;
  source: 'ai' | 'user' | 'system';
  status?: 'pending' | 'approved' | 'rejected' | 'reverted';
  actions: CategorizationAction[];
  createdAt?: Date;
}

/**
 * Action data types (JSONB)
 */
export type ActionData = 
  | AddTagActionData
  | AddCategoryActionData
  | CreateTagActionData 
  | CreateCategoryActionData;

export interface AddTagActionData {
  action: 'add_tag';
  target: ResourceType;
  target_id: string;
  tag_id: string;
}

export interface AddCategoryActionData {
  action: 'add_category';
  target: ResourceType;
  target_id: string;
  category_id: string;
}

export interface CreateTagActionData {
  action: 'create_tag';
  tag_name: string;
}

export interface CreateCategoryActionData {
  action: 'create_category';
  category_name: string;
}

/**
 * Action to categorize a resource
 */
export interface CategorizationAction {
  id?: string;
  actionData: ActionData;
  status?: 'pending' | 'executing' | 'executed' | 'failed' | 'rejected' | 'reverted';
  executedAt?: Date;
}

// Result of a categorization operation
export interface CategorizationResult {
  success: boolean;
  automationId?: string;
  error?: string;
  createdResources?: {
    categories?: Category[];
    tags?: Tag[];
  };
} 