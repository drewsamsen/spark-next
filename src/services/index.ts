/**
 * Export all service interfaces and implementations
 */

// Re-export all services
export { sparksService } from './sparks.service';
export { booksService } from './books.service';
export { highlightsService } from './highlights.service';
export { 
  categoryService,
  tagService, 
  jobService,
  categorizationService 
} from './categorization.service';

// Re-export type interfaces from services for convenience
export type { EnhancedSparkItem } from './sparks.service';

/**
 * Convenience bundler for all services
 */
import { sparksService } from './sparks.service';
import { booksService } from './books.service';
import { highlightsService } from './highlights.service';
import { categorizationService } from './categorization.service';

export const services = {
  sparks: sparksService,
  books: booksService,
  highlights: highlightsService,
  categorization: categorizationService
}; 