import { BaseRepository } from './base.repository';
import { DatabaseError } from '@/lib/errors';
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/lib/types';
import { DbClient } from '@/lib/db';

/**
 * Repository for handling user settings database access
 */
export class UserSettingsRepository extends BaseRepository {
  constructor(client: DbClient) {
    super(client);
  }

  /**
   * Get user settings from the database
   */
  async getUserSettings(): Promise<UserSettings> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return default settings
        return DEFAULT_USER_SETTINGS;
      }
      throw new DatabaseError('Error fetching user settings', error);
    }
    
    return data?.settings || DEFAULT_USER_SETTINGS;
  }

  /**
   * Update user settings in the database
   * @param settings Settings to update
   * @param mergeStrategy 'replace' to replace entire settings object, 'merge' to only update provided fields
   */
  async updateUserSettings(
    settings: Partial<UserSettings>,
    mergeStrategy: 'replace' | 'merge' = 'merge'
  ): Promise<UserSettings> {
    const userId = await this.getUserId();
    
    // If merge strategy is 'merge', we need to get current settings first
    let updatedSettings: UserSettings = settings as UserSettings;
    
    if (mergeStrategy === 'merge') {
      // Get current settings
      const { data, error } = await this.client
        .from('user_settings')
        .select('settings')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError('Error fetching current user settings for update', error);
      }
      
      // Merge current settings with new settings using deep merge
      const currentSettings = data?.settings || DEFAULT_USER_SETTINGS;
      updatedSettings = this.deepMerge(currentSettings, settings);
    }
    
    // Update settings in the database
    const { error } = await this.client
      .from('user_settings')
      .upsert({ 
        id: userId, 
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      throw new DatabaseError('Error updating user settings', error);
    }
    
    return updatedSettings;
  }

  /**
   * Deep merge objects for settings update
   * @private
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if a value is an object
   * @private
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
} 