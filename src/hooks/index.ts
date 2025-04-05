/**
 * Export all hooks for easy imports
 */

// Service hooks
export { useContentService } from './use-content-service';
export { 
  useServices,
  useSparksService,
  useBooksService,
  useHighlightsService,
  useCategorization,
  useResourceHelper,
  useAuthService,
  useIntegrationsService,
  useSidebarService,
  useHeaderService,
  useUserSettingsService
} from './use-services';

export { useFunctionLogsService } from './use-function-logs-service';

export { useUserSettings } from './use-user-settings-service';
export { useAuthSession } from './use-auth-session';

// Export categorization hooks
export { 
  useCategories, 
  useTags, 
  useCategorizationJobs 
} from './use-categorization';

// Export enhanced resource hooks
export { useSparks } from './use-sparks';
export { useNotesService } from './use-notes-service';

// Export new sidebar hooks
export * from './useSidebarVisibility';
export * from './useSidebarSelection';
export * from './useActiveItemTracking';
export * from './useSidebarSearch';

// Add additional hooks as needed 