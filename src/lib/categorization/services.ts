import { Category, CategorizationAutomation, CategorizationResult, Resource, ResourceType, Tag, CategoryWithUsage, TagWithUsage } from './types';

/**
 * Service for managing categories
 */
export interface CategoryService {
  /**
   * Get all categories
   */
  getCategories(): Promise<Category[]>;
  
  /**
   * Get all categories with usage counts
   */
  getCategoriesWithUsage(): Promise<CategoryWithUsage[]>;
  
  /**
   * Create a new category
   */
  createCategory(name: string): Promise<Category>;
  
  /**
   * Get categories for a specific resource
   */
  getCategoriesForResource(resource: Resource): Promise<Category[]>;
  
  /**
   * Get all resources of a specified type that have a category
   */
  getResourcesForCategory(categoryId: string, type?: ResourceType): Promise<Resource[]>;
  
  /**
   * Add a category to a resource
   */
  addCategoryToResource(resource: Resource, categoryId: string, source?: string): Promise<void>;
  
  /**
   * Remove a category from a resource
   */
  removeCategoryFromResource(resource: Resource, categoryId: string): Promise<void>;
}

/**
 * Service for managing tags
 */
export interface TagService {
  /**
   * Get all tags
   */
  getTags(): Promise<Tag[]>;
  
  /**
   * Get all tags with usage counts
   */
  getTagsWithUsage(): Promise<TagWithUsage[]>;
  
  /**
   * Create a new tag
   */
  createTag(name: string): Promise<Tag>;
  
  /**
   * Get tags for a specific resource
   */
  getTagsForResource(resource: Resource): Promise<Tag[]>;
  
  /**
   * Get all resources of a specified type that have a tag
   */
  getResourcesForTag(tagId: string, type?: ResourceType): Promise<Resource[]>;
  
  /**
   * Add a tag to a resource
   */
  addTagToResource(resource: Resource, tagId: string, source?: string): Promise<void>;
  
  /**
   * Remove a tag from a resource
   */
  removeTagFromResource(resource: Resource, tagId: string): Promise<void>;
}

/**
 * Service for managing automation
 */
export interface AutomationService {
  /**
   * Create a new categorization automation
   */
  createAutomation(automation: CategorizationAutomation): Promise<CategorizationResult>;
  
  /**
   * Get a specific automation by ID
   */
  getAutomation(automationId: string): Promise<CategorizationAutomation | null>;
  
  /**
   * Get all automations for the current user with optional filtering
   */
  getAutomations(filters?: { status?: string, source?: string }): Promise<CategorizationAutomation[]>;
  
  /**
   * Approve a pending automation
   */
  approveAutomation(automationId: string): Promise<CategorizationResult>;
  
  /**
   * Reject a pending automation and undo all its actions
   */
  rejectAutomation(automationId: string): Promise<CategorizationResult>;
  
  /**
   * Revert an approved automation
   */
  revertAutomation(automationId: string): Promise<CategorizationResult>;
  
  /**
   * Find which automation added a category/tag to a resource
   */
  findOriginatingAutomation(resource: Resource, categoryId?: string, tagId?: string): Promise<CategorizationAutomation | null>;
} 