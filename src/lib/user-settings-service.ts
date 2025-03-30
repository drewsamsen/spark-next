'use server';

import { cookies } from 'next/headers';
import { createServerClient } from './supabase';
import { UserSettings, DEFAULT_USER_SETTINGS } from './types';
import { cache } from 'react';

// Cache time for user settings in seconds
const CACHE_TIME = 60 * 5; // 5 minutes

// Get user settings from the database
export const getUserSettings = cache(async (userId?: string | null): Promise<UserSettings> => {
  if (!userId) {
    return DEFAULT_USER_SETTINGS;
  }

  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user settings:', error);
      return DEFAULT_USER_SETTINGS;
    }
    
    return data?.settings || DEFAULT_USER_SETTINGS;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    return DEFAULT_USER_SETTINGS;
  }
});

// Update user settings in the database
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const supabase = createServerClient();
    
    // First get the current settings
    const { data: currentData } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    // Merge current settings with the new settings
    const updatedSettings = {
      ...(currentData?.settings || DEFAULT_USER_SETTINGS),
      ...settings
    };
    
    // Update the settings in the database
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        id: userId, 
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error updating user settings:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Update a specific setting
export async function updateUserSetting(
  userId: string,
  key: keyof UserSettings,
  value: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = { [key]: value } as Partial<UserSettings>;
    return await updateUserSettings(userId, settings);
  } catch (error) {
    console.error('Error in updateUserSetting:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

// Update just the theme setting
export async function updateTheme(
  userId: string,
  theme: UserSettings['theme']
): Promise<{ success: boolean; error?: string }> {
  return updateUserSetting(userId, 'theme', theme);
}

// Update right sidebar width
export async function updateRightSidebarWidth(
  userId: string,
  width: number
): Promise<{ success: boolean; error?: string }> {
  return updateUserSettings(userId, {
    rightSidebar: { width }
  });
}

// Update left sidebar width
export async function updateLeftSidebarWidth(
  userId: string,
  width: number
): Promise<{ success: boolean; error?: string }> {
  return updateUserSettings(userId, {
    leftSidebar: { width }
  });
} 