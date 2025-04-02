import { getRepositories } from '@/repositories';
import { UserSettings } from '@/lib/types';
import { handleServiceItemError } from '@/lib/errors';

/**
 * Service for handling user settings operations
 */
export const userSettingsService = {
  /**
   * Get the current user's settings
   */
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      const repo = getRepositories().userSettings;
      return await repo.getUserSettings();
    } catch (error) {
      return handleServiceItemError<UserSettings>(error, 'Error in userSettingsService.getUserSettings');
    }
  },

  /**
   * Update user settings
   * 
   * @param settings Settings to update
   * @param mergeStrategy 'replace' to replace entire settings object, 'merge' to only update provided fields
   */
  async updateUserSettings(
    settings: Partial<UserSettings>,
    mergeStrategy: 'replace' | 'merge' = 'merge'
  ): Promise<UserSettings | null> {
    try {
      const repo = getRepositories().userSettings;
      return await repo.updateUserSettings(settings, mergeStrategy);
    } catch (error) {
      return handleServiceItemError<UserSettings>(error, 'Error in userSettingsService.updateUserSettings');
    }
  },

  /**
   * Update user theme
   */
  async updateTheme(theme: UserSettings['theme']): Promise<UserSettings | null> {
    return this.updateUserSettings({ theme });
  },

  /**
   * Update right sidebar width
   */
  async updateRightSidebarWidth(width: number): Promise<UserSettings | null> {
    return this.updateUserSettings({
      rightSidebar: { width }
    });
  },

  /**
   * Update left sidebar width
   */
  async updateLeftSidebarWidth(width: number): Promise<UserSettings | null> {
    return this.updateUserSettings({
      leftSidebar: { width }
    });
  }
}; 