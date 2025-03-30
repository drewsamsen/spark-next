'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/lib/types';
import { toast } from 'react-toastify';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import useSWR from 'swr';

// Interface for useUserSettings hook return value
interface UseUserSettingsReturn {
  settings: UserSettings;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  updateTheme: (theme: UserSettings['theme']) => Promise<void>;
  updateRightSidebarWidth: (width: number) => Promise<void>;
  updateLeftSidebarWidth: (width: number) => Promise<void>;
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  // Get the current auth session
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Fetching user settings, auth session:', !!session);
  
  if (!session) {
    console.log('No auth session found, returning default settings');
    return DEFAULT_USER_SETTINGS;
  }
  
  // Include session token for authentication
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    }
  });
  
  if (!res.ok) {
    console.error('Error fetching user settings:', res.status, await res.text());
    throw new Error('Failed to fetch user settings');
  }
  
  return res.json();
};

export function useUserSettings(): UseUserSettingsReturn {
  const supabase = getSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  
  // Use SWR for data fetching with caching and revalidation
  const { data, error, mutate } = useSWR<UserSettings>(
    userId ? '/api/user-settings' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 600000, // 10 minute
      fallbackData: DEFAULT_USER_SETTINGS
    }
  );

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Auth check, session:', !!session);
        if (session?.user) {
          setUserId(session.user.id);
          console.log('User authenticated, ID:', session.user.id);
        } else {
          console.log('No authenticated user found');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        if (session?.user) {
          setUserId(session.user.id);
          console.log('User authenticated, ID:', session.user.id);
        } else {
          setUserId(null);
          console.log('User not authenticated');
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Function to update settings
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    if (!userId) {
      console.warn('Cannot update settings: User not authenticated');
      return;
    }
    
    try {
      // Get the current auth session for the token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Authentication session expired');
        return;
      }
      
      console.log('Updating settings with auth token');
      
      // Optimistically update local data
      mutate(
        {
          ...data,
          ...newSettings,
        },
        false
      );
      
      // Send update to API with auth token
      const response = await fetch('/api/user-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', response.status, errorText);
        throw new Error(`Failed to update settings: ${errorText}`);
      }
      
      // Revalidate data after successful update
      mutate();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to save settings');
      
      // Revert to the previous data on error
      mutate();
    }
  }, [userId, data, mutate, supabase]);

  // Helper function to update theme
  const updateTheme = useCallback(
    async (theme: UserSettings['theme']) => {
      return updateSettings({ theme });
    },
    [updateSettings]
  );

  // Helper function to update right sidebar width
  const updateRightSidebarWidth = useCallback(
    async (width: number) => {
      return updateSettings({
        rightSidebar: {
          ...(data?.rightSidebar || {}),
          width,
        },
      });
    },
    [updateSettings, data]
  );

  // Helper function to update left sidebar width
  const updateLeftSidebarWidth = useCallback(
    async (width: number) => {
      return updateSettings({
        leftSidebar: {
          ...(data?.leftSidebar || {}),
          width,
        },
      });
    },
    [updateSettings, data]
  );

  return {
    settings: data || DEFAULT_USER_SETTINGS,
    isLoading: !error && !data && userId !== null,
    error: error || null,
    updateSettings,
    updateTheme,
    updateRightSidebarWidth,
    updateLeftSidebarWidth,
  };
} 