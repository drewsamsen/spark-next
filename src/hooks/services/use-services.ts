"use client";

import { services } from '@/services';

/**
 * Hook to access all services in React components
 */
export function useServices() {
  return services;
}

/**
 * Hook to access the sparks service in React components
 */
export function useSparksService() {
  return services.sparks;
}

/**
 * Hook to access the books service in React components
 */
export function useBooksService() {
  return services.books;
}

/**
 * Hook to access the highlights service in React components
 */
export function useHighlightsService() {
  return services.highlights;
}

/**
 * Hook to access the categorization services in React components
 */
export function useCategorization() {
  return services.categorization;
}

/**
 * Hook to access the auth service in React components
 */
export function useAuthService() {
  return services.auth;
}

/**
 * Hook to access the integrations service in React components
 */
export function useIntegrationsService() {
  return services.integrations;
}

/**
 * Hook to access the sidebar service in React components
 */
export function useSidebarService() {
  return services.sidebar;
}

/**
 * Hook to access the function logs service in React components
 */
export function useFunctionLogsService() {
  return services.functionLogs;
}

/**
 * Hook to access the header service in React components
 */
export function useHeaderService() {
  return services.header;
}

/**
 * Hook to access the user settings service in React components
 */
export function useUserSettingsService() {
  return services.userSettings;
}

/**
 * Helper hook for working with resources in the categorization system
 * This provides convenience methods to create resource objects
 */
export function useResourceHelper() {
  const getCurrentUserId = () => {
    try {
      // For client-side usage, we'll need to get the user ID from the session
      // This is a placeholder and should be replaced with an actual implementation
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }
      return userId;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return '';
    }
  };
  
  const createBookResource = (bookId: string) => {
    return {
      id: bookId,
      type: 'book' as const,
      userId: getCurrentUserId()
    };
  };
  
  const createHighlightResource = (highlightId: string) => {
    return {
      id: highlightId,
      type: 'highlight' as const,
      userId: getCurrentUserId()
    };
  };
  
  const createSparkResource = (sparkId: string) => {
    return {
      id: sparkId,
      type: 'spark' as const,
      userId: getCurrentUserId()
    };
  };
  
  return {
    createBookResource,
    createHighlightResource,
    createSparkResource,
    getCurrentUserId
  };
} 