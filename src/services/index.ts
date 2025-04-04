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
export { authService } from './auth.service';
export { integrationsService } from './integrations.service';
export { functionLogsService } from './function-logs.service';
export { sidebarService } from './sidebar.service';
export { headerService } from './header.service';
export { userSettingsService } from './user-settings.service';
export { airtableService } from './airtable.service';
export { notesService } from './notes.service';

// Re-export type interfaces from services for convenience
export type { EnhancedSparkItem } from './sparks.service';
export type { AuthUser, AuthSession } from './auth.service';
export type { AirtableSettings, ReadwiseSettings, ReadwiseConnectionTestData, ReadwiseSyncData } from './integrations.service';
export type { SortField, SortDirection, SortState } from './sidebar.service';
export type { AirtableImportData } from './airtable.service';
export type { TagMigrationData } from './categorization.service';

/**
 * Convenience bundler for all services
 */
import { sparksService } from './sparks.service';
import { booksService } from './books.service';
import { highlightsService } from './highlights.service';
import { categorizationService } from './categorization.service';
import { authService } from './auth.service';
import { integrationsService } from './integrations.service';
import { sidebarService } from './sidebar.service';
import { functionLogsService } from './function-logs.service';
import { headerService } from './header.service';
import { userSettingsService } from './user-settings.service';
import { airtableService } from './airtable.service';

export const services = {
  sparks: sparksService,
  books: booksService,
  highlights: highlightsService,
  categorization: categorizationService,
  auth: authService,
  integrations: integrationsService,
  sidebar: sidebarService,
  functionLogs: functionLogsService,
  header: headerService,
  userSettings: userSettingsService,
  airtable: airtableService
}; 