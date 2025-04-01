// Export all types
export * from './types';

// Export service interfaces
export * from './services';

// Export service implementations
import { CategoryServiceImpl } from './category-service';
import { TagServiceImpl } from './tag-service';
import { JobServiceImpl } from './job-service';

// Singleton instances
let categoryService: CategoryServiceImpl | null = null;
let tagService: TagServiceImpl | null = null;
let jobService: JobServiceImpl | null = null;

/**
 * Get the singleton instance of the category service
 */
export function getCategoryService(): CategoryServiceImpl {
  if (!categoryService) {
    categoryService = new CategoryServiceImpl();
  }
  return categoryService;
}

/**
 * Get the singleton instance of the tag service
 */
export function getTagService(): TagServiceImpl {
  if (!tagService) {
    tagService = new TagServiceImpl();
  }
  return tagService;
}

/**
 * Get the singleton instance of the job service
 */
export function getJobService(): JobServiceImpl {
  if (!jobService) {
    jobService = new JobServiceImpl();
  }
  return jobService;
}

// Export a React hook for use in components
export function useCategorization() {
  return {
    categories: getCategoryService(),
    tags: getTagService(),
    jobs: getJobService(),
  };
} 