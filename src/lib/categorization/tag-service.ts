import { getRepositories } from "@/repositories";
import { Resource, ResourceType, Tag } from "./types";
import { TagService } from "./services";
import { getResourceIdColumn, getTagJunctionTable, prepareTagJunction, toResource, verifyResourceOwnership } from "./db-utils";

export class TagServiceImpl implements TagService {
  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    const repo = getRepositories().categorization;
    
    const { data, error } = await repo.getAllTags();
      
    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }
    
    return data.map(row => ({
      id: row.id,
      name: row.name
    }));
  }
  
  /**
   * Create a new tag
   */
  async createTag(name: string): Promise<Tag> {
    if (!name || name.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }
    
    const repo = getRepositories().categorization;
    
    const { data, error } = await repo.createTag(name);
      
    if (error) {
      if (error.code === '23505') { // Unique violation
        // Check if it exists
        const { data: existingTag } = await repo.findTagByName(name);
          
        if (existingTag) {
          return {
            id: existingTag.id,
            name: existingTag.name
          };
        }
      }
      
      throw new Error(`Failed to create tag: ${error.message}`);
    }
    
    return {
      id: data.id,
      name: data.name
    };
  }
  
  /**
   * Get tags for a specific resource
   */
  async getTagsForResource(resource: Resource): Promise<Tag[]> {
    const repo = getRepositories().categorization;
    const junctionTable = getTagJunctionTable(resource.type);
    const resourceIdColumn = getResourceIdColumn(resource.type);
    
    // Add explicit type for the SQL result
    type JunctionResult = {
      tag_id: string;
      tags: {
        id: string;
        name: string;
      };
    };
    
    const { data, error } = await repo.getTagsForResource(resource, resourceIdColumn, junctionTable);
      
    if (error) {
      console.error(`Error fetching tags for ${resource.type}:`, error);
      return [];
    }
    
    // Transform the data to Tag array
    const tags: Tag[] = [];
    
    // Safely process each row
    (data as unknown as JunctionResult[]).forEach(row => {
      if (row.tags) {
        tags.push({
          id: row.tags.id,
          name: row.tags.name
        });
      }
    });
    
    return tags;
  }
  
  /**
   * Get all resources of a specified type that have a tag
   */
  async getResourcesForTag(tagId: string, type?: ResourceType): Promise<Resource[]> {
    const repo = getRepositories().categorization;
    const results: Resource[] = [];
    
    // If type is specified, only query that resource type
    const typesToQuery = type ? [type] : Object.keys(getTagJunctionTable) as ResourceType[];
    
    for (const resourceType of typesToQuery) {
      const junctionTable = getTagJunctionTable(resourceType);
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
      
      const { data, error } = await repo.getResourcesForTag(
        tagId, 
        junctionTable, 
        resourceIdColumn, 
        joinColumnName
      );
        
      if (error) {
        console.error(`Error fetching ${resourceType} resources for tag:`, error);
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
   * Add a tag to a resource
   */
  async addTagToResource(resource: Resource, tagId: string, source: string = 'user'): Promise<void> {
    // Verify the resource exists and belongs to the user
    const isValid = await verifyResourceOwnership(resource);
    if (!isValid) {
      throw new Error(`Resource not found or you don't have access to it`);
    }
    
    const repo = getRepositories().categorization;
    const junctionTable = getTagJunctionTable(resource.type);
    
    // Prepare the junction record
    const junction = prepareTagJunction(resource, tagId);
    junction.created_by = source;
    
    const { error } = await repo.addTagToResource(junctionTable, junction);
      
    if (error) {
      throw new Error(`Failed to add tag: ${error.message}`);
    }
  }
  
  /**
   * Remove a tag from a resource
   */
  async removeTagFromResource(resource: Resource, tagId: string): Promise<void> {
    const repo = getRepositories().categorization;
    const junctionTable = getTagJunctionTable(resource.type);
    const resourceIdColumn = getResourceIdColumn(resource.type);
    
    const { error } = await repo.removeTagFromResource(
      junctionTable,
      resourceIdColumn,
      resource.id,
      tagId
    );
      
    if (error) {
      throw new Error(`Failed to remove tag: ${error.message}`);
    }
  }
} 