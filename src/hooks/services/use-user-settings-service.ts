'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/lib/types';
import { toast } from 'react-toastify';
import { useUserSettingsService } from './use-services';
import { useAuthService } from './use-services';

// Interface for useUserSettings hook return value
interface UseUserSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  updateTheme: (theme: UserSettings['theme']) => Promise<void>;
  updateRightSidebarWidth: (width: number) => Promise<void>;
  updateLeftSidebarWidth: (width: number) => Promise<void>;
}

/**
 * React hook for managing user settings using the userSettingsService
 */
export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const userSettingsService = useUserSettingsService();
  const authService = useAuthService();
  
  // Load settings on mount or when the auth state changes
  useEffect(() => {
    let isMounted = true;
    
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const isAuthenticated = await authService.isAuthenticated();
        
        if (!isAuthenticated) {
          // If not authenticated, use default settings
          if (isMounted) {
            setSettings(DEFAULT_USER_SETTINGS);
            setIsLoading(false);
          }
          return;
        }
        
        // Get user settings from service
        const userSettings = await userSettingsService.getUserSettings();
        
        if (isMounted) {
          setSettings(userSettings || DEFAULT_USER_SETTINGS);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading user settings:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load settings'));
          // Use default settings if there's an error
          setSettings(DEFAULT_USER_SETTINGS);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadSettings();
    
    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange(() => {
      loadSettings();
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [userSettingsService, authService]);
  
  // Function to update settings
  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      try {
        // Check if user is authenticated
        const isAuthenticated = await authService.isAuthenticated();
        
        if (!isAuthenticated) {
          toast.error('You must be logged in to update settings');
          return;
        }
        
        // Optimistically update local state
        setSettings((current) => {
          if (!current) return DEFAULT_USER_SETTINGS;
          return { ...current, ...newSettings };
        });
        
        // Update settings in the service
        const updatedSettings = await userSettingsService.updateUserSettings(newSettings);
        
        // Update local state with the result from the service
        if (updatedSettings) {
          setSettings(updatedSettings);
        }
      } catch (err) {
        console.error('Error updating settings:', err);
        toast.error('Failed to save settings');
        
        // Reload settings to revert to previous state
        const currentSettings = await userSettingsService.getUserSettings();
        setSettings(currentSettings || DEFAULT_USER_SETTINGS);
      }
    },
    [userSettingsService, authService]
  );
  
  // Helper to update theme
  const updateTheme = useCallback(
    async (theme: UserSettings['theme']) => {
      return updateSettings({ theme });
    },
    [updateSettings]
  );
  
  // Helper to update right sidebar width
  const updateRightSidebarWidth = useCallback(
    async (width: number) => {
      return updateSettings({
        rightSidebar: {
          ...(settings?.rightSidebar || {}),
          width,
        },
      });
    },
    [updateSettings, settings]
  );
  
  // Helper to update left sidebar width
  const updateLeftSidebarWidth = useCallback(
    async (width: number) => {
      return updateSettings({
        leftSidebar: {
          ...(settings?.leftSidebar || {}),
          width,
        },
      });
    },
    [updateSettings, settings]
  );
  
  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateTheme,
    updateRightSidebarWidth,
    updateLeftSidebarWidth,
  };
} 