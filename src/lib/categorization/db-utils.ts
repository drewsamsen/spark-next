import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Resource, ResourceType } from "./types";

// Map resource types to their respective tables
const RESOURCE_TABLES = {
  book: 'books',
  highlight: 'highlights'
};

// Map resource types to their category junction tables
const CATEGORY_JUNCTION_TABLES = {
  book: 'book_categories',
  highlight: 'highlight_categories'
};

// Map resource types to their tag junction tables
const TAG_JUNCTION_TABLES = {
  book: 'book_tags',
  highlight: 'highlight_tags'
};

// Map resource types to their primary key columns in junction tables
const RESOURCE_ID_COLUMNS = {
  book: 'book_id',
  highlight: 'highlight_id'
};

/**
 * Generate a resource object from a database entity
 */
export function toResource(type: ResourceType, entity: any): Resource {
  return {
    id: entity.id,
    type,
    userId: entity.user_id
  };
}

/**
 * Verify that a resource exists and belongs to the specified user
 */
export async function verifyResourceOwnership(resource: Resource): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const table = RESOURCE_TABLES[resource.type];
  
  const { data, error } = await supabase
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
export function getCategoryJunctionTable(resourceType: ResourceType): string {
  return CATEGORY_JUNCTION_TABLES[resourceType];
}

/**
 * Get the appropriate tag junction table for a resource type
 */
export function getTagJunctionTable(resourceType: ResourceType): string {
  return TAG_JUNCTION_TABLES[resourceType];
}

/**
 * Get the appropriate resource ID column for a resource type in junction tables
 */
export function getResourceIdColumn(resourceType: ResourceType): string {
  return RESOURCE_ID_COLUMNS[resourceType];
}

/**
 * Prepare an insert object for a category junction table
 */
export function prepareCategoryJunction(resource: Resource, categoryId: string, jobActionId?: string) {
  const idColumn = getResourceIdColumn(resource.type);
  
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
export function prepareTagJunction(resource: Resource, tagId: string, jobActionId?: string) {
  const idColumn = getResourceIdColumn(resource.type);
  
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
export async function findCategoryJobAction(resource: Resource, categoryId: string): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const junctionTable = getCategoryJunctionTable(resource.type);
  const idColumn = getResourceIdColumn(resource.type);
  
  const { data, error } = await supabase
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
export async function findTagJobAction(resource: Resource, tagId: string): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const junctionTable = getTagJunctionTable(resource.type);
  const idColumn = getResourceIdColumn(resource.type);
  
  const { data, error } = await supabase
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