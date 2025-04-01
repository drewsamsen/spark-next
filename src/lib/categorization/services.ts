import { Category, CategorizationJob, CategorizationResult, Resource, ResourceType, Tag } from './types';

/**
 * Service for managing categories
 */
export interface CategoryService {
  /**
   * Get all categories
   */
  getCategories(): Promise<Category[]>;
  
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
 * Service for managing categorization jobs
 */
export interface JobService {
  /**
   * Create a new categorization job
   */
  createJob(job: CategorizationJob): Promise<CategorizationResult>;
  
  /**
   * Get a specific job by ID
   */
  getJob(jobId: string): Promise<CategorizationJob | null>;
  
  /**
   * Get all jobs for the current user with optional filtering
   */
  getJobs(filters?: { status?: string, source?: string }): Promise<CategorizationJob[]>;
  
  /**
   * Approve a pending job
   */
  approveJob(jobId: string): Promise<CategorizationResult>;
  
  /**
   * Reject a pending job and undo all its actions
   */
  rejectJob(jobId: string): Promise<CategorizationResult>;
  
  /**
   * Find which job added a category/tag to a resource
   */
  findOriginatingJob(resource: Resource, categoryId?: string, tagId?: string): Promise<CategorizationJob | null>;
} 