import { Category, Resource, ResourceType, CategoryWithUsage } from "./types";
import { CategoryService } from "./services";
import { getRepositories } from "@/repositories";

export class CategoryServiceImpl implements CategoryService {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const repos = getRepositories();
    
    try {
      const categories = await repos.categories.getCategories();
      
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
  
  /**
   * Get all categories with usage counts
   */
  async getCategoriesWithUsage(): Promise<CategoryWithUsage[]> {
    const repos = getRepositories();
    
    try {
      const categories = await repos.categories.getCategoriesWithUsage();
      
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        usageCount: category.usage_count
      }));
    } catch (error) {
      console.error('Error fetching categories with usage counts:', error);
      return [];
    }
  }
  
  /**
   * Create a new category
   */
  async createCategory(name: string): Promise<Category> {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    
    const repos = getRepositories();
    
    try {
      const category = await repos.categories.createCategory({ name });
      
      return {
        id: category.id,
        name: category.name,
        slug: category.slug
      };
    } catch (error) {
      throw new Error(`Failed to create category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get categories for a specific resource
   */
  async getCategoriesForResource(resource: Resource): Promise<Category[]> {
    const repos = getRepositories();
    
    try {
      const categories = await repos.categories.getCategoriesForResource(resource);
      
      return categories.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug
      }));
    } catch (error) {
      console.error(`Error fetching categories for ${resource.type}:`, error);
      return [];
    }
  }
  
  /**
   * Get all resources of a specified type that have a category
   */
  async getResourcesForCategory(categoryId: string, type?: ResourceType): Promise<Resource[]> {
    const repos = getRepositories();
    const results: Resource[] = [];
    
    try {
      // Get the current user ID to add to resources
      const authRepo = repos.auth;
      let userId = '';
      try {
        const session = await authRepo.getSession();
        userId = session?.user?.id || '';
      } catch (e) {
        // If there's no session, continue with empty userId
        console.warn('No user session found for getResourcesForCategory');
      }
      
      if (type) {
        // If type is specified, only get resources of that type
        const resourceIds = await repos.categories.getResourcesForCategory(categoryId, type);
        
        // Convert resource IDs to Resource objects
        for (const resourceId of resourceIds) {
          // For each resource ID, create a Resource object
          results.push({
            id: resourceId,
            type: type,
            userId: userId
          });
        }
      } else {
        // If no type specified, get all resource types
        const typesToQuery = ['book', 'highlight', 'spark'] as ResourceType[];
        
        for (const resourceType of typesToQuery) {
          const resourceIds = await repos.categories.getResourcesForCategory(categoryId, resourceType);
          
          // Convert resource IDs to Resource objects
          for (const resourceId of resourceIds) {
            results.push({
              id: resourceId,
              type: resourceType,
              userId: userId
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error(`Error fetching resources for category:`, error);
      return [];
    }
  }
  
  /**
   * Add a category to a resource
   */
  async addCategoryToResource(resource: Resource, categoryId: string, source: string = 'user'): Promise<void> {
    const repos = getRepositories();
    
    try {
      // Verify the resource exists and belongs to the user
      const isValid = await repos.categorization.verifyResourceOwnership(resource);
      if (!isValid) {
        throw new Error(`Resource not found or you don't have access to it`);
      }
      
      await repos.categories.addCategoryToResource(resource, categoryId);
    } catch (error) {
      throw new Error(`Failed to add category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Remove a category from a resource
   */
  async removeCategoryFromResource(resource: Resource, categoryId: string): Promise<void> {
    const repos = getRepositories();
    
    try {
      await repos.categories.removeCategoryFromResource(resource, categoryId);
    } catch (error) {
      throw new Error(`Failed to remove category: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 