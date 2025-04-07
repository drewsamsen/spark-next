// Export all types
export * from './types';

// Export service interfaces
export * from './services';

// Export service implementations
import { CategoryServiceImpl } from './category-service';
import { TagServiceImpl } from './tag-service';
import { AutomationServiceImpl } from './automation-service';

// Singleton instances
let categoryService: CategoryServiceImpl | null = null;
let tagService: TagServiceImpl | null = null;
let automationService: AutomationServiceImpl | null = null;

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
 * Get the singleton instance of the automation service
 */
export function getAutomationService(): AutomationServiceImpl {
  if (!automationService) {
    automationService = new AutomationServiceImpl();
  }
  return automationService;
}

// Export a React hook for use in components
export function useCategorization() {
  return {
    categories: getCategoryService(),
    tags: getTagService(),
    automations: getAutomationService(),
  };
} 