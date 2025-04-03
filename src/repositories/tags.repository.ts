import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError, ValidationError } from '@/lib/errors';
import { Resource, ResourceType } from '@/lib/categorization/types';
import { TagModelWithUsage, TagDomainWithUsage } from '@/lib/types';

/**
 * Database model for a tag
 */
export interface TagModel {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Tag domain model
 */
export interface TagDomain {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input to create a new tag
 */
export interface CreateTagInput {
  name: string;
}

/**
 * Repository for tags
 */
export class TagsRepository extends BaseRepository<TagModel> {
  constructor(client: DbClient) {
    super(client, 'tags'); // Pass the table name to BaseRepository
  }

  /**
   * Get all tags for the current user
   */
  async getTags(): Promise<TagModel[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    
    if (error) {
      throw new DatabaseError('Error fetching tags', error);
    }
    
    return data;
  }

  /**
   * Get a tag by ID
   */
  async getTagById(tagId: string): Promise<TagModel | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching tag with ID ${tagId}`, error);
    }
    
    return data;
  }

  /**
   * Get a tag by name
   */
  async getTagByName(name: string): Promise<TagModel | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('tags')
      .select('*')
      .eq('name', name)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching tag with name ${name}`, error);
    }
    
    return data;
  }

  /**
   * Create a new tag
   */
  async createTag(input: CreateTagInput): Promise<TagModel> {
    const userId = await this.getUserId();
    
    // Check if tag with this name already exists
    const existingTag = await this.getTagByName(input.name);
    if (existingTag) {
      return existingTag; // Return existing tag instead of creating duplicate
    }
    
    const { data, error } = await this.client
      .from('tags')
      .insert({
        user_id: userId,
        name: input.name
      })
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError('Error creating tag', error);
    }
    
    return data;
  }

  /**
   * Update an existing tag
   */
  async updateTag(
    tagId: string, 
    updates: {name: string}
  ): Promise<TagModel> {
    const userId = await this.getUserId();
    
    // Verify the tag exists and belongs to this user
    await this.verifyUserOwnership('tags', tagId, userId);
    
    const { data, error } = await this.client
      .from('tags')
      .update({
        name: updates.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', tagId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError(`Error updating tag with ID ${tagId}`, error);
    }
    
    return data;
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Verify the tag exists and belongs to this user
    await this.verifyUserOwnership('tags', tagId, userId);
    
    // Delete all relations first (cascade delete not enforced in JavaScript)
    await this.removeAllTagRelations(tagId);
    
    // Delete the tag
    const { error } = await this.client
      .from('tags')
      .delete()
      .eq('id', tagId)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error deleting tag with ID ${tagId}`, error);
    }
  }

  /**
   * Get all tags for a resource
   */
  async getTagsForResource(resource: Resource): Promise<TagModel[]> {
    const userId = await this.getUserId();
    
    // Validate the resource
    if (resource.userId !== userId) {
      throw new ValidationError('Cannot access resource from another user');
    }
    
    // Get the right junction table and resource ID column
    const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resource.type);
    
    // First get the tag IDs from the junction table
    const { data: junctionData, error: junctionError } = await this.client
      .from(junctionTable)
      .select('tag_id')
      .eq(resourceIdColumn, resource.id);
    
    if (junctionError) {
      throw new DatabaseError(`Error fetching tag relations for resource ${resource.id}`, junctionError);
    }
    
    if (junctionData.length === 0) {
      return [];
    }
    
    // Then get the actual tags
    const tagIds = junctionData.map(relation => relation.tag_id);
    
    const { data, error } = await this.client
      .from('tags')
      .select('*')
      .in('id', tagIds)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error fetching tags for resource ${resource.id}`, error);
    }
    
    return data;
  }

  /**
   * Add a tag to a resource
   */
  async addTagToResource(resource: Resource, tagId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Validate resource and tag ownership
    if (resource.userId !== userId) {
      throw new ValidationError('Cannot access resource from another user');
    }
    
    await this.verifyUserOwnership('tags', tagId, userId);
    
    // Get the right junction table and resource ID column
    const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resource.type);
    
    // Check if relation already exists
    const { data: existingRel, error: checkError } = await this.client
      .from(junctionTable)
      .select('*')
      .eq(resourceIdColumn, resource.id)
      .eq('tag_id', tagId)
      .maybeSingle();
    
    if (checkError) {
      throw new DatabaseError(`Error checking existing tag relation`, checkError);
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
        'tag_id': tagId
      });
    
    if (error) {
      throw new DatabaseError(`Error adding tag to resource`, error);
    }
  }

  /**
   * Remove a tag from a resource
   */
  async removeTagFromResource(resource: Resource, tagId: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Validate resource and tag ownership
    if (resource.userId !== userId) {
      throw new ValidationError('Cannot access resource from another user');
    }
    
    await this.verifyUserOwnership('tags', tagId, userId);
    
    // Get the right junction table and resource ID column
    const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resource.type);
    
    // Delete the relation
    const { error } = await this.client
      .from(junctionTable)
      .delete()
      .eq(resourceIdColumn, resource.id)
      .eq('tag_id', tagId);
    
    if (error) {
      throw new DatabaseError(`Error removing tag from resource`, error);
    }
  }

  /**
   * Get all resources of a specific type with a tag
   */
  async getResourcesForTag(tagId: string, type?: ResourceType): Promise<string[]> {
    const userId = await this.getUserId();
    
    // Verify tag ownership
    await this.verifyUserOwnership('tags', tagId, userId);
    
    // If no type specified, get all resources
    if (!type) {
      const resourceIds: string[] = [];
      
      // For each resource type, get resources with this tag
      for (const resType of ['book', 'highlight', 'spark'] as ResourceType[]) {
        const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resType);
        
        const { data, error } = await this.client
          .from(junctionTable)
          .select(resourceIdColumn)
          .eq('tag_id', tagId);
        
        if (error) {
          throw new DatabaseError(`Error fetching ${resType}s for tag ${tagId}`, error);
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
      .eq('tag_id', tagId);
    
    if (error) {
      throw new DatabaseError(`Error fetching ${type}s for tag ${tagId}`, error);
    }
    
    // Type assertion to handle the dynamic property access
    return data.map(item => item[resourceIdColumn as keyof typeof item] as string);
  }

  /**
   * Remove all relations for a tag (used during deletion)
   */
  private async removeAllTagRelations(tagId: string): Promise<void> {
    // For each junction table, remove all relations
    for (const type of ['book', 'highlight', 'spark'] as ResourceType[]) {
      const { junctionTable } = this.getJunctionInfo(type);
      
      const { error } = await this.client
        .from(junctionTable)
        .delete()
        .eq('tag_id', tagId);
      
      if (error) {
        throw new DatabaseError(`Error removing tag relations from ${junctionTable}`, error);
      }
    }
  }

  /**
   * Map a database tag model to the domain model
   */
  mapToDomain(tag: TagModel): TagDomain {
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at
    };
  }

  /**
   * Get junction table info for a resource type
   */
  private getJunctionInfo(type: ResourceType): { junctionTable: string, resourceIdColumn: string } {
    const junctionMap: Record<ResourceType, { junctionTable: string, resourceIdColumn: string }> = {
      book: { junctionTable: 'book_tags', resourceIdColumn: 'book_id' },
      highlight: { junctionTable: 'highlight_tags', resourceIdColumn: 'highlight_id' },
      spark: { junctionTable: 'spark_tags', resourceIdColumn: 'spark_id' }
    };
    
    const junction = junctionMap[type];
    if (!junction) {
      throw new ValidationError(`Unsupported resource type: ${type}`);
    }
    
    return junction;
  }

  /**
   * Get all tags for the current user with usage counts
   */
  async getTagsWithUsage(): Promise<TagModelWithUsage[]> {
    try {
      const userId = await this.getUserId();
      
      const { data, error } = await this.client
        .from('tag_usage_counts')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      
      if (error) {
        throw new DatabaseError('Error fetching tags with usage counts', error);
      }
      
      return data || [];
    } catch (error) {
      console.error('TagsRepository.getTagsWithUsage - error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new DatabaseError('Error fetching tags with usage counts', error);
    }
  }

  /**
   * Map a database tag model with usage to the domain model
   */
  mapToDomainWithUsage(tag: TagModelWithUsage): TagDomainWithUsage {
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.created_at,
      updatedAt: tag.updated_at,
      usageCount: tag.usage_count
    };
  }
} 