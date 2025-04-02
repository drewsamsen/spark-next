/**
 * Export all hooks for easy imports
 */

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
export { useFunctionLogs } from './use-function-logs';

export { useUserSettings } from './use-user-settings-service';

export { useAuthSession } from './use-auth-session';

// Export new categorization hooks
export { 
  useCategories, 
  useTags, 
  useCategorizationJobs 
} from './use-categorization';

// Export enhanced resource hooks
export { useSparks } from './use-sparks'; 