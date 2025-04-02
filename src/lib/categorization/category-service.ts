import { Category, Resource, ResourceType } from "./types";
import { CategoryService } from "./services";
import { generateSlug } from "@/lib/utils";
import { getRepositories } from "@/repositories";
import { getDbClient } from "@/lib/db";

export class CategoryServiceImpl implements CategoryService {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const db = getDbClient();
    
    const { data, error } = await db
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug
    }));
  }
  
  /**
   * Create a new category
   */
  async createCategory(name: string): Promise<Category> {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
    
    const db = getDbClient();
    const slug = generateSlug(name);
    
    const { data, error } = await db
      .from('categories')
      .insert({ name, slug })
      .select()
      .single();
      
    if (error) {
      if (error.code === '23505') { // Unique violation
        // Check if it exists
        const { data: existingCategory } = await db
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .single();
          
        if (existingCategory) {
          return {
            id: existingCategory.id,
            name: existingCategory.name,
            slug: existingCategory.slug
          };
        }
      }
      
      throw new Error(`Failed to create category: ${error.message}`);
    }
    
    return {
      id: data.id,
      name: data.name,
      slug: data.slug
    };
  }
  
  /**
   * Get categories for a specific resource
   */
  async getCategoriesForResource(resource: Resource): Promise<Category[]> {
    const repos = getRepositories();
    const db = getDbClient();
    const junctionTable = repos.categorization.getCategoryJunctionTable(resource.type);
    const resourceIdColumn = repos.categorization.getResourceIdColumn(resource.type);
    
    // Add explicit type for the SQL result
    type JunctionResult = {
      category_id: string;
      categories: {
        id: string;
        name: string;
        slug: string;
      };
    };
    
    const { data, error } = await db
      .from(junctionTable)
      .select(`
        category_id,
        categories:category_id (
          id, name, slug
        )
      `)
      .eq(resourceIdColumn, resource.id);
      
    if (error) {
      console.error(`Error fetching categories for ${resource.type}:`, error);
      return [];
    }
    
    // Transform the data to Category array
    const categories: Category[] = [];
    
    // Safely process each row
    (data as unknown as JunctionResult[]).forEach(row => {
      if (row.categories) {
        categories.push({
          id: row.categories.id,
          name: row.categories.name,
          slug: row.categories.slug
        });
      }
    });
    
    return categories;
  }
  
  /**
   * Get all resources of a specified type that have a category
   */
  async getResourcesForCategory(categoryId: string, type?: ResourceType): Promise<Resource[]> {
    const repos = getRepositories();
    const db = getDbClient();
    const results: Resource[] = [];
    
    // If type is specified, only query that resource type
    const typesToQuery = type 
      ? [type] 
      : ['book', 'highlight', 'spark'] as ResourceType[];
    
    for (const resourceType of typesToQuery) {
      const junctionTable = repos.categorization.getCategoryJunctionTable(resourceType);
      const resourceIdColumn = repos.categorization.getResourceIdColumn(resourceType);
      
      // Format column name for the join
      const joinColumnName = `resource_data`;
      
      // Define the return type from the query
      type JunctionWithResource = {
        [key: string]: {
          id: string;
          user_id: string;
        };
      };
      
      const { data, error } = await db
        .from(junctionTable)
        .select(`
          ${resourceIdColumn},
          ${joinColumnName}:${resourceIdColumn} (
            id, user_id
          )
        `)
        .eq('category_id', categoryId);
        
      if (error) {
        console.error(`Error fetching ${resourceType} resources for category:`, error);
        continue;
      }
      
      // Add resources to results array
      (data as unknown as JunctionWithResource[]).forEach(row => {
        const resourceData = row[joinColumnName];
        if (resourceData) {
          results.push(repos.categorization.toResource(resourceType, resourceData));
        }
      });
    }
    
    return results;
  }
  
  /**
   * Add a category to a resource
   */
  async addCategoryToResource(resource: Resource, categoryId: string, source: string = 'user'): Promise<void> {
    const repos = getRepositories();
    
    // Verify the resource exists and belongs to the user
    const isValid = await repos.categorization.verifyResourceOwnership(resource);
    if (!isValid) {
      throw new Error(`Resource not found or you don't have access to it`);
    }
    
    const db = getDbClient();
    const junctionTable = repos.categorization.getCategoryJunctionTable(resource.type);
    
    // Prepare the junction record
    const junction = repos.categorization.prepareCategoryJunction(resource, categoryId);
    junction.created_by = source;
    
    const { error } = await db
      .from(junctionTable)
      .upsert(junction);
      
    if (error) {
      throw new Error(`Failed to add category: ${error.message}`);
    }
  }
  
  /**
   * Remove a category from a resource
   */
  async removeCategoryFromResource(resource: Resource, categoryId: string): Promise<void> {
    const repos = getRepositories();
    const db = getDbClient();
    const junctionTable = repos.categorization.getCategoryJunctionTable(resource.type);
    const resourceIdColumn = repos.categorization.getResourceIdColumn(resource.type);
    
    const { error } = await db
      .from(junctionTable)
      .delete()
      .eq(resourceIdColumn, resource.id)
      .eq('category_id', categoryId);
      
    if (error) {
      throw new Error(`Failed to remove category: ${error.message}`);
    }
  }
} 