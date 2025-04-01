import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Category, Resource, ResourceType } from "./types";
import { CategoryService } from "./services";
import { getCategoryJunctionTable, getResourceIdColumn, prepareCategoryJunction, toResource, verifyResourceOwnership } from "./db-utils";
import { generateSlug } from "@/lib/utils";

export class CategoryServiceImpl implements CategoryService {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    return data.map(row => ({
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
    
    const supabase = getSupabaseBrowserClient();
    const slug = generateSlug(name);
    
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug })
      .select()
      .single();
      
    if (error) {
      if (error.code === '23505') { // Unique violation
        // Check if it exists
        const { data: existingCategory } = await supabase
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
    const supabase = getSupabaseBrowserClient();
    const junctionTable = getCategoryJunctionTable(resource.type);
    const resourceIdColumn = getResourceIdColumn(resource.type);
    
    // Add explicit type for the SQL result
    type JunctionResult = {
      category_id: string;
      categories: {
        id: string;
        name: string;
        slug: string;
      };
    };
    
    const { data, error } = await supabase
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
    const supabase = getSupabaseBrowserClient();
    const results: Resource[] = [];
    
    // If type is specified, only query that resource type
    const typesToQuery = type ? [type] : Object.keys(getCategoryJunctionTable) as ResourceType[];
    
    for (const resourceType of typesToQuery) {
      const junctionTable = getCategoryJunctionTable(resourceType);
      const resourceIdColumn = getResourceIdColumn(resourceType);
      
      // Format column name for the join
      const joinColumnName = `resource_data`;
      
      // Define the return type from the query
      type JunctionWithResource = {
        [key: string]: {
          id: string;
          user_id: string;
        };
      };
      
      const { data, error } = await supabase
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
          results.push(toResource(resourceType, resourceData));
        }
      });
    }
    
    return results;
  }
  
  /**
   * Add a category to a resource
   */
  async addCategoryToResource(resource: Resource, categoryId: string, source: string = 'user'): Promise<void> {
    // Verify the resource exists and belongs to the user
    const isValid = await verifyResourceOwnership(resource);
    if (!isValid) {
      throw new Error(`Resource not found or you don't have access to it`);
    }
    
    const supabase = getSupabaseBrowserClient();
    const junctionTable = getCategoryJunctionTable(resource.type);
    
    // Prepare the junction record
    const junction = prepareCategoryJunction(resource, categoryId);
    junction.created_by = source;
    
    const { error } = await supabase
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
    const supabase = getSupabaseBrowserClient();
    const junctionTable = getCategoryJunctionTable(resource.type);
    const resourceIdColumn = getResourceIdColumn(resource.type);
    
    const { error } = await supabase
      .from(junctionTable)
      .delete()
      .eq(resourceIdColumn, resource.id)
      .eq('category_id', categoryId);
      
    if (error) {
      throw new Error(`Failed to remove category: ${error.message}`);
    }
  }
} 