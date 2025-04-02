import { BaseRepository } from './base.repository';
import { Resource, ResourceType } from '@/lib/categorization/types';

// Map resource types to their respective tables
const RESOURCE_TABLES = {
  book: 'books',
  highlight: 'highlights',
  spark: 'sparks'
};

// Map resource types to their category junction tables
const CATEGORY_JUNCTION_TABLES = {
  book: 'book_categories',
  highlight: 'highlight_categories',
  spark: 'spark_categories'
};

// Map resource types to their tag junction tables
const TAG_JUNCTION_TABLES = {
  book: 'book_tags',
  highlight: 'highlight_tags',
  spark: 'spark_tags'
};

// Map resource types to their primary key columns in junction tables
const RESOURCE_ID_COLUMNS = {
  book: 'book_id',
  highlight: 'highlight_id',
  spark: 'spark_id'
};

/**
 * Repository for categorization-related operations
 */
export class CategorizationRepository extends BaseRepository {
  /**
   * Generate a resource object from a database entity
   */
  toResource(type: ResourceType, entity: any): Resource {
    return {
      id: entity.id,
      type,
      userId: entity.user_id
    };
  }

  /**
   * Verify that a resource exists and belongs to the specified user
   */
  async verifyResourceOwnership(resource: Resource): Promise<boolean> {
    const table = RESOURCE_TABLES[resource.type];
    
    const { data, error } = await this.client
      .from(table)
      .select('id')
      .eq('id', resource.id)
      .eq('user_id', resource.userId)
      .single();
    
    return !!data && !error;
  }

  /**
   * Get the appropriate category junction table for a resource type
   */
  getCategoryJunctionTable(resourceType: ResourceType): string {
    return CATEGORY_JUNCTION_TABLES[resourceType];
  }

  /**
   * Get the appropriate tag junction table for a resource type
   */
  getTagJunctionTable(resourceType: ResourceType): string {
    return TAG_JUNCTION_TABLES[resourceType];
  }

  /**
   * Get the appropriate resource ID column for a resource type in junction tables
   */
  getResourceIdColumn(resourceType: ResourceType): string {
    return RESOURCE_ID_COLUMNS[resourceType];
  }

  /**
   * Prepare an insert object for a category junction table
   */
  prepareCategoryJunction(resource: Resource, categoryId: string, jobActionId?: string) {
    const idColumn = this.getResourceIdColumn(resource.type);
    
    return {
      [idColumn]: resource.id,
      category_id: categoryId,
      job_action_id: jobActionId || null,
      created_by: jobActionId ? 'job' : 'user'
    };
  }

  /**
   * Prepare an insert object for a tag junction table
   */
  prepareTagJunction(resource: Resource, tagId: string, jobActionId?: string) {
    const idColumn = this.getResourceIdColumn(resource.type);
    
    return {
      [idColumn]: resource.id,
      tag_id: tagId,
      job_action_id: jobActionId || null,
      created_by: jobActionId ? 'job' : 'user'
    };
  }

  /**
   * Find job action ID for a category assigned to a resource
   */
  async findCategoryJobAction(resource: Resource, categoryId: string): Promise<string | null> {
    const junctionTable = this.getCategoryJunctionTable(resource.type);
    const idColumn = this.getResourceIdColumn(resource.type);
    
    const { data, error } = await this.client
      .from(junctionTable)
      .select('job_action_id')
      .eq(idColumn, resource.id)
      .eq('category_id', categoryId)
      .single();
    
    if (error || !data || !data.job_action_id) {
      return null;
    }
    
    return data.job_action_id;
  }

  /**
   * Find job action ID for a tag assigned to a resource
   */
  async findTagJobAction(resource: Resource, tagId: string): Promise<string | null> {
    const junctionTable = this.getTagJunctionTable(resource.type);
    const idColumn = this.getResourceIdColumn(resource.type);
    
    const { data, error } = await this.client
      .from(junctionTable)
      .select('job_action_id')
      .eq(idColumn, resource.id)
      .eq('tag_id', tagId)
      .single();
    
    if (error || !data || !data.job_action_id) {
      return null;
    }
    
    return data.job_action_id;
  }

  /**
   * Get all tags
   */
  async getAllTags() {
    const { data, error } = await this.client
      .from('tags')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching tags:', error);
      return { data: [], error };
    }
    
    return { data, error: null };
  }

  /**
   * Create a new tag
   */
  async createTag(name: string) {
    const { data, error } = await this.client
      .from('tags')
      .insert({ name })
      .select()
      .single();
      
    return { data, error };
  }

  /**
   * Find tag by name
   */
  async findTagByName(name: string) {
    const { data, error } = await this.client
      .from('tags')
      .select('*')
      .eq('name', name)
      .single();
      
    return { data, error };
  }

  /**
   * Get tags for a specific resource
   */
  async getTagsForResource(resource: Resource, resourceIdColumn: string, junctionTable: string) {
    const { data, error } = await this.client
      .from(junctionTable)
      .select(`
        tag_id,
        tags:tag_id (
          id, name
        )
      `)
      .eq(resourceIdColumn, resource.id);
      
    return { data, error };
  }

  /**
   * Get resources for a tag
   */
  async getResourcesForTag(tagId: string, junctionTable: string, resourceIdColumn: string, joinColumnName: string) {
    const { data, error } = await this.client
      .from(junctionTable)
      .select(`
        ${resourceIdColumn},
        ${joinColumnName}:${resourceIdColumn} (
          id, user_id
        )
      `)
      .eq('tag_id', tagId);
      
    return { data, error };
  }

  /**
   * Add a tag to a resource
   */
  async addTagToResource(junctionTable: string, junction: any) {
    const { error } = await this.client
      .from(junctionTable)
      .upsert(junction);
      
    return { error };
  }

  /**
   * Remove a tag from a resource
   */
  async removeTagFromResource(junctionTable: string, resourceIdColumn: string, resourceId: string, tagId: string) {
    const { error } = await this.client
      .from(junctionTable)
      .delete()
      .eq(resourceIdColumn, resourceId)
      .eq('tag_id', tagId);
      
    return { error };
  }
} 