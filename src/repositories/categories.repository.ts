import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError, ValidationError } from '@/lib/errors';
import { Resource, ResourceType } from '@/lib/categorization/types';

/**
 * Database model for a category
 */
export interface CategoryModel {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

/**
 * Category domain model
 */
export interface CategoryDomain {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input to create a new category
 */
export interface CreateCategoryInput {
  name: string;
}

/**
 * Repository for categories
 */
export class CategoriesRepository extends BaseRepository {
  constructor(client: DbClient) {
    super(client);
  }

  /**
   * Get all categories for the current user
   */
  async getCategories(): Promise<CategoryModel[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    
    if (error) {
      throw new DatabaseError('Error fetching categories', error);
    }
    
    return data;
  }

  /**
   * Get a category by ID
   */
  async getCategoryById(categoryId: string): Promise<CategoryModel | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching category with ID ${categoryId}`, error);
    }
    
    return data;
  }

  /**
   * Get a category by slug
   */
  async getCategoryBySlug(slug: string): Promise<CategoryModel | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching category with slug ${slug}`, error);
    }
    
    return data;
  }

  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<CategoryModel> {
    const userId = await this.getUserId();
    const slug = this.generateSlug(input.name);
    
    // Check if category with this slug already exists
    const existingCategory = await this.getCategoryBySlug(slug);
    if (existingCategory) {
      return existingCategory; // Return existing category instead of creating duplicate
    }
    
    const { data, error } = await this.client
      .from('categories')
      .insert({
        user_id: userId,
        name: input.name,
        slug
      })
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('Error creating category', error);
    }
    
    return data;
  }

  /**
   * Update an existing category
   */
  async updateCategory(
    categoryId: string, 
    updates: {name: string}
  ): Promise<CategoryModel> {
    const userId = await this.getUserId();
    
    // Verify the category exists and belongs to this user
    await this.verifyUserOwnership('categories', categoryId, userId);
    
    // Generate a new slug if name is changing
    const slug = this.generateSlug(updates.name);
    
    const { data, error } = await this.client
      .from('categories')
      .update({
        name: updates.name,
        slug,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError(`Error updating category with ID ${categoryId}`, error);
    }
    
    return data;
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Verify the category exists and belongs to this user
    await this.verifyUserOwnership('categories', categoryId, userId);
    
    // Delete all relations first (cascade delete not enforced in JavaScript)
    await this.removeAllCategoryRelations(categoryId);
    
    // Delete the category
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error deleting category with ID ${categoryId}`, error);
    }
  }

  /**
   * Get all categories for a resource
   */
  async getCategoriesForResource(resource: Resource): Promise<CategoryModel[]> {
    const userId = await this.getUserId();
    
    // Validate the resource
    if (resource.userId !== userId) {
      throw new ValidationError('Cannot access resource from another user');
    }
    
    // Get the right junction table and resource ID column
    const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resource.type);
    
    // First get the category IDs from the junction table
    const { data: junctionData, error: junctionError } = await this.client
      .from(junctionTable)
      .select('category_id')
      .eq(resourceIdColumn, resource.id);
    
    if (junctionError) {
      throw new DatabaseError(`Error fetching category relations for resource ${resource.id}`, junctionError);
    }
    
    if (junctionData.length === 0) {
      return [];
    }
    
    // Then get the actual categories
    const categoryIds = junctionData.map(relation => relation.category_id);
    
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .in('id', categoryIds)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error fetching categories for resource ${resource.id}`, error);
    }
    
    return data;
  }

  /**
   * Add a category to a resource
   */
  async addCategoryToResource(resource: Resource, categoryId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Validate resource and category ownership
    if (resource.userId !== userId) {
      throw new ValidationError('Cannot access resource from another user');
    }
    
    await this.verifyUserOwnership('categories', categoryId, userId);
    
    // Get the right junction table and resource ID column
    const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resource.type);
    
    // Check if relation already exists
    const { data: existingRel, error: checkError } = await this.client
      .from(junctionTable)
      .select('*')
      .eq(resourceIdColumn, resource.id)
      .eq('category_id', categoryId)
      .maybeSingle();
    
    if (checkError) {
      throw new DatabaseError(`Error checking existing category relation`, checkError);
    }
    
    // If relation already exists, we're done
    if (existingRel) {
      return;
    }
    
    // Create the relation
    const { error } = await this.client
      .from(junctionTable)
      .insert({
        [resourceIdColumn]: resource.id,
        'category_id': categoryId
      });
    
    if (error) {
      throw new DatabaseError(`Error adding category to resource`, error);
    }
  }

  /**
   * Remove a category from a resource
   */
  async removeCategoryFromResource(resource: Resource, categoryId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Validate resource and category ownership
    if (resource.userId !== userId) {
      throw new ValidationError('Cannot access resource from another user');
    }
    
    await this.verifyUserOwnership('categories', categoryId, userId);
    
    // Get the right junction table and resource ID column
    const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resource.type);
    
    // Delete the relation
    const { error } = await this.client
      .from(junctionTable)
      .delete()
      .eq(resourceIdColumn, resource.id)
      .eq('category_id', categoryId);
    
    if (error) {
      throw new DatabaseError(`Error removing category from resource`, error);
    }
  }

  /**
   * Get all resources of a specific type with a category
   */
  async getResourcesForCategory(categoryId: string, type?: ResourceType): Promise<string[]> {
    const userId = await this.getUserId();
    
    // Verify category ownership
    await this.verifyUserOwnership('categories', categoryId, userId);
    
    // If no type specified, get all resources
    if (!type) {
      const resourceIds: string[] = [];
      
      // For each resource type, get resources with this category
      for (const resType of ['book', 'highlight', 'spark'] as ResourceType[]) {
        const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resType);
        
        const { data, error } = await this.client
          .from(junctionTable)
          .select(resourceIdColumn)
          .eq('category_id', categoryId);
        
        if (error) {
          throw new DatabaseError(`Error fetching ${resType}s for category ${categoryId}`, error);
        }
        
        // Type assertion to handle the dynamic property access
        resourceIds.push(...data.map(item => item[resourceIdColumn as keyof typeof item] as string));
      }
      
      return resourceIds;
    }
    
    // If type specified, query just that junction table
    const { junctionTable, resourceIdColumn } = this.getJunctionInfo(type);
    
    const { data, error } = await this.client
      .from(junctionTable)
      .select(resourceIdColumn)
      .eq('category_id', categoryId);
    
    if (error) {
      throw new DatabaseError(`Error fetching ${type}s for category ${categoryId}`, error);
    }
    
    // Type assertion to handle the dynamic property access
    return data.map(item => item[resourceIdColumn as keyof typeof item] as string);
  }

  /**
   * Remove all relations for a category (used during deletion)
   */
  private async removeAllCategoryRelations(categoryId: string): Promise<void> {
    // For each junction table, remove all relations
    for (const type of ['book', 'highlight', 'spark'] as ResourceType[]) {
      const { junctionTable } = this.getJunctionInfo(type);
      
      const { error } = await this.client
        .from(junctionTable)
        .delete()
        .eq('category_id', categoryId);
      
      if (error) {
        throw new DatabaseError(`Error removing category relations from ${junctionTable}`, error);
      }
    }
  }

  /**
   * Map a database category model to the domain model
   */
  mapToDomain(category: CategoryModel): CategoryDomain {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      createdAt: category.created_at,
      updatedAt: category.updated_at
    };
  }

  /**
   * Generate a URL-friendly slug from a name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '')     // Remove non-word chars
      .replace(/\-\-+/g, '-')       // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '')           // Trim hyphen from start
      .replace(/-+$/, '');          // Trim hyphen from end
  }

  /**
   * Get junction table info for a resource type
   */
  private getJunctionInfo(type: ResourceType): { junctionTable: string, resourceIdColumn: string } {
    const junctionMap: Record<ResourceType, { junctionTable: string, resourceIdColumn: string }> = {
      book: { junctionTable: 'book_categories', resourceIdColumn: 'book_id' },
      highlight: { junctionTable: 'highlight_categories', resourceIdColumn: 'highlight_id' },
      spark: { junctionTable: 'spark_categories', resourceIdColumn: 'spark_id' }
    };
    
    const junction = junctionMap[type];
    if (!junction) {
      throw new ValidationError(`Unsupported resource type: ${type}`);
    }
    
    return junction;
  }
} 