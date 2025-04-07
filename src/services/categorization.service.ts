import { getRepositories } from '@/repositories';
import { CategoryDomain } from '@/lib/types';
import { TagDomain } from '@/repositories/tags.repository';
import { Resource, ResourceType, Category, Tag, CategorizationAutomation, CategorizationAction, CategorizationResult, CategoryWithUsage, TagWithUsage } from '@/lib/categorization/types';
import { CategoryService, TagService, AutomationService } from '@/lib/categorization/services';
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
   * Get all tags with usage counts
   */
  async getTagsWithUsage(): Promise<TagWithUsage[]> {
    try {
      const repo = getRepositories().tags;
      
      const tags = await repo.getTagsWithUsage();
      
      return tags.map(tag => repo.mapToDomainWithUsage(tag));
    } catch (error) {
      return handleServiceError<TagWithUsage>(error, 'Error in tagService.getTagsWithUsage');
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
 * Implementation of the automation service
 */
class AutomationServiceImpl implements AutomationService {
  /**
   * Create a new categorization automation
   */
  async createAutomation(automation: CategorizationAutomation): Promise<CategorizationResult> {
    try {
      // Validate the automation
      if (!automation.userId) {
        return { 
          success: false, 
          error: 'Missing userId in automation' 
        };
      }
      
      if (!automation.actions || automation.actions.length === 0) {
        return { 
          success: false, 
          error: 'Automation must have at least one action' 
        };
      }
      
      // Execute the actions
      const createdResources = {
        categories: [] as CategoryDomain[],
        tags: [] as TagDomain[]
      };
      
      for (const action of automation.actions) {
        try {
          await this.executeAction(action, automation.userId, createdResources);
        } catch (error) {
          console.error(`Error executing automation action:`, error);
          // Continue with other actions despite errors
        }
      }
      
      // For now, we don't actually store the automation in the database
      // In a real implementation, we would create an automation record and store all actions
      
      return {
        success: true,
        automationId: crypto.randomUUID(), // Placeholder ID
        createdResources
      };
    } catch (error) {
      console.error('Error in automationService.createAutomation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get a specific automation by ID
   */
  async getAutomation(automationId: string): Promise<CategorizationAutomation | null> {
    // This would normally fetch from the database
    // For now, return null as we're not storing automations
    return null;
  }

  /**
   * Get all automations for the current user with optional filtering
   */
  async getAutomations(filters?: { status?: string, source?: string }): Promise<CategorizationAutomation[]> {
    // This would normally fetch from the database
    // For now, return empty array as we're not storing automations
    return [];
  }

  /**
   * Approve a pending automation
   */
  async approveAutomation(automationId: string): Promise<CategorizationResult> {
    // This would normally update the automation status in the database
    return {
      success: false,
      error: 'Automation management is not fully implemented'
    };
  }

  /**
   * Reject a pending automation and undo all its actions
   */
  async rejectAutomation(automationId: string): Promise<CategorizationResult> {
    // This would normally undo all actions and update the automation status
    return {
      success: false,
      error: 'Automation management is not fully implemented'
    };
  }

  /**
   * Revert an approved automation
   */
  async revertAutomation(automationId: string): Promise<CategorizationResult> {
    // This would normally revert all actions and update the automation status
    return {
      success: false,
      error: 'Automation management is not fully implemented'
    };
  }

  /**
   * Find which automation added a category/tag to a resource
   */
  async findOriginatingAutomation(resource: Resource, categoryId?: string, tagId?: string): Promise<CategorizationAutomation | null> {
    // This would normally search the automation history
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
    // Implementation would go here
  }
}

/**
 * Service instance for automation management
 */
export const automationService = new AutomationServiceImpl();

/**
 * Combined service for categorization operations
 */
export const categorizationService = {
  /**
   * Migrate tag data for a user for v2 tag system
   */
  validateTagMigrationData(
    userId: string
  ): { valid: boolean; error?: string } {
    try {
      if (!userId) {
        return { valid: false, error: 'Missing user ID' };
      }
      
      return { valid: true };
    } catch (error) {
      console.error('Error validating tag migration data:', error);
      return { valid: false, error: error instanceof Error ? error.message : 'Unknown error validating' };
    }
  },
  
  /**
   * Prepare tag migration data for a user
   */
  prepareTagMigrationData(
    userId: string
  ): TagMigrationData {
    return {
      userId
    };
  }
};

export interface TagMigrationData {
  userId: string;
} 