import { getRepositories } from '@/repositories';
import { CategoryDomain } from '@/lib/types';
import { TagDomain } from '@/repositories/tags.repository';
import { Resource, ResourceType, Category, Tag, CategorizationJob, CategorizationAction, CategorizationResult, CategoryWithUsage } from '@/lib/categorization/types';
import { CategoryService, TagService, JobService } from '@/lib/categorization/services';
import { handleServiceError, handleServiceItemError, ValidationError } from '@/lib/errors';

/**
 * Service for managing categories
 */
export const categoryService: CategoryService = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const repo = getRepositories().categories;
      
      const categories = await repo.getCategories();
      
      return categories.map(category => repo.mapToDomain(category));
    } catch (error) {
      return handleServiceError<Category>(error, 'Error in categoryService.getCategories');
    }
  },

  /**
   * Get all categories with usage counts
   */
  async getCategoriesWithUsage(): Promise<CategoryWithUsage[]> {
    try {
      const repo = getRepositories().categories;
      
      const categories = await repo.getCategoriesWithUsage();
      
      return categories.map(category => repo.mapToDomainWithUsage(category));
    } catch (error) {
      return handleServiceError<CategoryWithUsage>(error, 'Error in categoryService.getCategoriesWithUsage');
    }
  },

  /**
   * Create a new category
   */
  async createCategory(name: string): Promise<Category> {
    try {
      const repo = getRepositories().categories;
      
      if (!name.trim()) {
        throw new ValidationError('Category name cannot be empty');
      }
      
      const category = await repo.createCategory({ name: name.trim() });
      
      return repo.mapToDomain(category);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      return handleServiceItemError<Category>(error, 'Error in categoryService.createCategory') as Category;
    }
  },

  /**
   * Get categories for a specific resource
   */
  async getCategoriesForResource(resource: Resource): Promise<Category[]> {
    try {
      const repo = getRepositories().categories;
      
      const categories = await repo.getCategoriesForResource(resource);
      
      return categories.map(category => repo.mapToDomain(category));
    } catch (error) {
      return handleServiceError<Category>(error, `Error in categoryService.getCategoriesForResource for resource ${resource.id}`);
    }
  },

  /**
   * Get all resources of a specified type that have a category
   */
  async getResourcesForCategory(categoryId: string, type?: ResourceType): Promise<Resource[]> {
    try {
      const repo = getRepositories().categories;
      
      // First get the category to check if it exists
      const category = await repo.getCategoryById(categoryId);
      if (!category) {
        return [];
      }
      
      // Then get the resource IDs
      const resourceIds = await repo.getResourcesForCategory(categoryId, type);
      
      // Convert the IDs to Resource objects
      const userId = category.user_id;
      
      return resourceIds.map(id => ({
        id,
        type: type || 'book', // Default to book if not specified
        userId
      }));
    } catch (error) {
      return handleServiceError<Resource>(error, `Error in categoryService.getResourcesForCategory for category ${categoryId}`);
    }
  },

  /**
   * Add a category to a resource
   */
  async addCategoryToResource(resource: Resource, categoryId: string, source?: string): Promise<void> {
    try {
      const repo = getRepositories().categories;
      
      // First check if the category exists
      const category = await repo.getCategoryById(categoryId);
      if (!category) {
        throw new ValidationError(`Category with ID ${categoryId} not found`);
      }
      
      await repo.addCategoryToResource(resource, categoryId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error in categoryService.addCategoryToResource for resource ${resource.id} and category ${categoryId}:`, error);
    }
  },

  /**
   * Remove a category from a resource
   */
  async removeCategoryFromResource(resource: Resource, categoryId: string): Promise<void> {
    try {
      const repo = getRepositories().categories;
      
      await repo.removeCategoryFromResource(resource, categoryId);
    } catch (error) {
      console.error(`Error in categoryService.removeCategoryFromResource for resource ${resource.id} and category ${categoryId}:`, error);
    }
  }
};

/**
 * Service for managing tags
 */
export const tagService: TagService = {
  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    try {
      const repo = getRepositories().tags;
      
      const tags = await repo.getTags();
      
      return tags.map(tag => repo.mapToDomain(tag));
    } catch (error) {
      return handleServiceError<Tag>(error, 'Error in tagService.getTags');
    }
  },

  /**
   * Create a new tag
   */
  async createTag(name: string): Promise<Tag> {
    try {
      const repo = getRepositories().tags;
      
      if (!name.trim()) {
        throw new ValidationError('Tag name cannot be empty');
      }
      
      const tag = await repo.createTag({ name: name.trim() });
      
      return repo.mapToDomain(tag);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      return handleServiceItemError<Tag>(error, 'Error in tagService.createTag') as Tag;
    }
  },

  /**
   * Get tags for a specific resource
   */
  async getTagsForResource(resource: Resource): Promise<Tag[]> {
    try {
      const repo = getRepositories().tags;
      
      const tags = await repo.getTagsForResource(resource);
      
      return tags.map(tag => repo.mapToDomain(tag));
    } catch (error) {
      return handleServiceError<Tag>(error, `Error in tagService.getTagsForResource for resource ${resource.id}`);
    }
  },

  /**
   * Get all resources of a specified type that have a tag
   */
  async getResourcesForTag(tagId: string, type?: ResourceType): Promise<Resource[]> {
    try {
      const repo = getRepositories().tags;
      
      // First get the tag to check if it exists
      const tag = await repo.getTagById(tagId);
      if (!tag) {
        return [];
      }
      
      // Then get the resource IDs
      const resourceIds = await repo.getResourcesForTag(tagId, type);
      
      // Convert the IDs to Resource objects
      const userId = tag.user_id;
      
      return resourceIds.map(id => ({
        id,
        type: type || 'book', // Default to book if not specified
        userId
      }));
    } catch (error) {
      return handleServiceError<Resource>(error, `Error in tagService.getResourcesForTag for tag ${tagId}`);
    }
  },

  /**
   * Add a tag to a resource
   */
  async addTagToResource(resource: Resource, tagId: string, source?: string): Promise<void> {
    try {
      const repo = getRepositories().tags;
      
      // First check if the tag exists
      const tag = await repo.getTagById(tagId);
      if (!tag) {
        throw new ValidationError(`Tag with ID ${tagId} not found`);
      }
      
      await repo.addTagToResource(resource, tagId);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      console.error(`Error in tagService.addTagToResource for resource ${resource.id} and tag ${tagId}:`, error);
    }
  },

  /**
   * Remove a tag from a resource
   */
  async removeTagFromResource(resource: Resource, tagId: string): Promise<void> {
    try {
      const repo = getRepositories().tags;
      
      await repo.removeTagFromResource(resource, tagId);
    } catch (error) {
      console.error(`Error in tagService.removeTagFromResource for resource ${resource.id} and tag ${tagId}:`, error);
    }
  }
};

/**
 * Implementation of the job service
 */
class JobServiceImpl implements JobService {
  /**
   * Create a new categorization job
   */
  async createJob(job: CategorizationJob): Promise<CategorizationResult> {
    try {
      // Validate the job
      if (!job.userId) {
        return { 
          success: false, 
          error: 'Missing userId in job' 
        };
      }
      
      if (!job.actions || job.actions.length === 0) {
        return { 
          success: false, 
          error: 'Job must have at least one action' 
        };
      }
      
      // Execute the actions
      const createdResources = {
        categories: [] as CategoryDomain[],
        tags: [] as TagDomain[]
      };
      
      for (const action of job.actions) {
        try {
          await this.executeAction(action, job.userId, createdResources);
        } catch (error) {
          console.error(`Error executing job action ${action.actionType}:`, error);
          // Continue with other actions despite errors
        }
      }
      
      // For now, we don't actually store the job in the database
      // In a real implementation, we would create a job record and store all actions
      
      return {
        success: true,
        jobId: crypto.randomUUID(), // Placeholder ID
        createdResources
      };
    } catch (error) {
      console.error('Error in jobService.createJob:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a specific job by ID
   */
  async getJob(jobId: string): Promise<CategorizationJob | null> {
    // This would normally fetch from the database
    // For now, return null as we're not storing jobs
    return null;
  }

  /**
   * Get all jobs for the current user with optional filtering
   */
  async getJobs(filters?: { status?: string, source?: string }): Promise<CategorizationJob[]> {
    // This would normally fetch from the database
    // For now, return empty array as we're not storing jobs
    return [];
  }

  /**
   * Approve a pending job
   */
  async approveJob(jobId: string): Promise<CategorizationResult> {
    // This would normally update the job status in the database
    return {
      success: false,
      error: 'Job management is not fully implemented'
    };
  }

  /**
   * Reject a pending job and undo all its actions
   */
  async rejectJob(jobId: string): Promise<CategorizationResult> {
    // This would normally undo all actions and update the job status
    return {
      success: false,
      error: 'Job management is not fully implemented'
    };
  }

  /**
   * Find which job added a category/tag to a resource
   */
  async findOriginatingJob(resource: Resource, categoryId?: string, tagId?: string): Promise<CategorizationJob | null> {
    // This would normally search the job history
    return null;
  }

  /**
   * Execute a single categorization action
   * Private helper method
   */
  private async executeAction(
    action: CategorizationAction, 
    userId: string,
    createdResources: {
      categories: CategoryDomain[];
      tags: TagDomain[];
    }
  ): Promise<void> {
    if (!action.resource && (action.actionType === 'add_category' || action.actionType === 'add_tag')) {
      throw new ValidationError('Resource is required for add actions');
    }
    
    switch (action.actionType) {
      case 'create_category':
        if (!action.categoryName) {
          throw new ValidationError('Category name is required for create_category action');
        }
        
        const newCategory = await categoryService.createCategory(action.categoryName);
        createdResources.categories.push(newCategory as CategoryDomain);
        
        // If resource provided, also add the category to it
        if (action.resource) {
          await categoryService.addCategoryToResource(action.resource, newCategory.id);
        }
        break;
        
      case 'add_category':
        if (!action.categoryId) {
          throw new ValidationError('Category ID is required for add_category action');
        }
        
        if (!action.resource) {
          throw new ValidationError('Resource is required for add_category action');
        }
        
        await categoryService.addCategoryToResource(action.resource, action.categoryId);
        break;
        
      case 'create_tag':
        if (!action.tagName) {
          throw new ValidationError('Tag name is required for create_tag action');
        }
        
        const newTag = await tagService.createTag(action.tagName);
        createdResources.tags.push(newTag as TagDomain);
        
        // If resource provided, also add the tag to it
        if (action.resource) {
          await tagService.addTagToResource(action.resource, newTag.id);
        }
        break;
        
      case 'add_tag':
        if (!action.tagId) {
          throw new ValidationError('Tag ID is required for add_tag action');
        }
        
        if (!action.resource) {
          throw new ValidationError('Resource is required for add_tag action');
        }
        
        await tagService.addTagToResource(action.resource, action.tagId);
        break;
        
      default:
        throw new ValidationError(`Unknown action type: ${action.actionType}`);
    }
  }
}

// Create a singleton instance of the job service
export const jobService: JobService = new JobServiceImpl();

/**
 * Type for tag migration data
 */
export interface TagMigrationData {
  userId: string;
}

/**
 * Convenience object to access all categorization services
 */
export const categorizationService = {
  categories: categoryService,
  tags: tagService,
  jobs: jobService,
  
  /**
   * Validate tag migration data
   */
  validateTagMigrationData(
    userId: string
  ): { valid: boolean; error?: string } {
    try {
      // Validate required parameters
      if (!userId) {
        return { valid: false, error: 'User ID is required' };
      }
      
      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error during validation';
      
      return { valid: false, error: errorMessage };
    }
  },
  
  /**
   * Prepare tag migration data
   */
  prepareTagMigrationData(
    userId: string
  ): TagMigrationData {
    return { userId };
  }
}; 