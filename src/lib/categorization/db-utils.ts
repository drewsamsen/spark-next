import { getRepositories } from '@/repositories';
import { Resource, ResourceType } from "./types";

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
 * Generate a resource object from a database entity
 */
export function toResource(type: ResourceType, entity: any): Resource {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.toResource(type, entity);
}

/**
 * Verify that a resource exists and belongs to the specified user
 */
export async function verifyResourceOwnership(resource: Resource): Promise<boolean> {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.verifyResourceOwnership(resource);
}

/**
 * Get the appropriate category junction table for a resource type
 */
export function getCategoryJunctionTable(resourceType: ResourceType): string {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.getCategoryJunctionTable(resourceType);
}

/**
 * Get the appropriate tag junction table for a resource type
 */
export function getTagJunctionTable(resourceType: ResourceType): string {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.getTagJunctionTable(resourceType);
}

/**
 * Get the appropriate resource ID column for a resource type in junction tables
 */
export function getResourceIdColumn(resourceType: ResourceType): string {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.getResourceIdColumn(resourceType);
}

/**
 * Prepare an insert object for a category junction table
 */
export function prepareCategoryJunction(resource: Resource, categoryId: string, jobActionId?: string) {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.prepareCategoryJunction(resource, categoryId, jobActionId);
}

/**
 * Prepare an insert object for a tag junction table
 */
export function prepareTagJunction(resource: Resource, tagId: string, jobActionId?: string) {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.prepareTagJunction(resource, tagId, jobActionId);
}

/**
 * Find job action ID for a category assigned to a resource
 */
export async function findCategoryJobAction(resource: Resource, categoryId: string): Promise<string | null> {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.findCategoryJobAction(resource, categoryId);
}

/**
 * Find job action ID for a tag assigned to a resource
 */
export async function findTagJobAction(resource: Resource, tagId: string): Promise<string | null> {
  const categorizationRepo = getRepositories().categorization;
  return categorizationRepo.findTagJobAction(resource, tagId);
} 