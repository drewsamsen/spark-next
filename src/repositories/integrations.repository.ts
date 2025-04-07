import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { DatabaseError, NotFoundError } from '@/lib/errors';

/**
 * Repository for integration settings
 */
export class IntegrationsRepository extends BaseRepository<Record<string, any>> {
  constructor(client: DbClient) {
    super(client, 'user_settings');
  }

  /**
   * Get Airtable integration settings for the current user
   */
  async getAirtableSettings() {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new DatabaseError('Error fetching Airtable settings', error);
    }
    
    // Get values from the settings JSONB field
    const settings = data?.settings || {};
    
    return {
      apiKey: settings?.integrations?.airtable?.apiKey || null,
      baseId: settings?.integrations?.airtable?.baseId || null,
      tableId: settings?.integrations?.airtable?.tableId || null
    };
  }

  /**
   * Update Airtable integration settings
   */
  async updateAirtableSettings(settings: {
    apiKey?: string;
    baseId?: string;
    tableId?: string;
  }) {
    const userId = await this.getUserId();
    
    // Check if settings already exist
    const { data: existingSettings, error: checkError } = await this.client
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (checkError) {
      throw new DatabaseError('Error checking user settings', checkError);
    }
    
    // Prepare the updated settings object
    const currentSettings = existingSettings?.settings || {};
    
    // Make sure the nested structure exists
    if (!currentSettings.integrations) {
      currentSettings.integrations = {};
    }
    
    if (!currentSettings.integrations.airtable) {
      currentSettings.integrations.airtable = {};
    }
    
    // Update only the fields that were provided
    if (settings.apiKey !== undefined) {
      currentSettings.integrations.airtable.apiKey = settings.apiKey;
    }
    
    if (settings.baseId !== undefined) {
      currentSettings.integrations.airtable.baseId = settings.baseId;
    }
    
    if (settings.tableId !== undefined) {
      currentSettings.integrations.airtable.tableId = settings.tableId;
    }
    
    // Set isConnected based on whether all required fields are present
    const allFieldsPresent = 
      currentSettings.integrations.airtable.apiKey && 
      currentSettings.integrations.airtable.baseId && 
      currentSettings.integrations.airtable.tableId;
    
    currentSettings.integrations.airtable.isConnected = allFieldsPresent;
    
    // Update settings in the database
    const { error } = await this.client
      .from('user_settings')
      .upsert({
        id: userId,
        settings: currentSettings
      });
    
    if (error) {
      throw new DatabaseError('Error updating Airtable settings', error);
    }
    
    return true;
  }

  /**
   * Get Readwise integration settings for the current user
   */
  async getReadwiseSettings() {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw new DatabaseError('Error fetching Readwise settings', error);
    }
    
    // Get values from the settings JSONB field
    const settings = data?.settings || {};
    
    return {
      accessToken: settings?.integrations?.readwise?.apiKey || null,
      lastSync: settings?.integrations?.readwise?.lastSyncTime || null
    };
  }

  /**
   * Update Readwise integration settings
   */
  async updateReadwiseSettings(settings: {
    accessToken?: string;
    lastSync?: string;
  }) {
    const userId = await this.getUserId();
    
    // Check if settings already exist
    const { data: existingSettings, error: checkError } = await this.client
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (checkError) {
      throw new DatabaseError('Error checking user settings', checkError);
    }
    
    // Prepare the updated settings object
    const currentSettings = existingSettings?.settings || {};
    
    // Make sure the nested structure exists
    if (!currentSettings.integrations) {
      currentSettings.integrations = {};
    }
    
    if (!currentSettings.integrations.readwise) {
      currentSettings.integrations.readwise = {};
    }
    
    // Update only the fields that were provided
    if (settings.accessToken !== undefined) {
      currentSettings.integrations.readwise.apiKey = settings.accessToken;
    }
    
    if (settings.lastSync !== undefined) {
      currentSettings.integrations.readwise.lastSyncTime = settings.lastSync;
    }
    
    // Set isConnected based on whether the API key is present
    currentSettings.integrations.readwise.isConnected = 
      !!currentSettings.integrations.readwise.apiKey;
    
    // Update settings in the database
    const { error } = await this.client
      .from('user_settings')
      .upsert({
        id: userId,
        settings: currentSettings
      });
    
    if (error) {
      throw new DatabaseError('Error updating Readwise settings', error);
    }
    
    return true;
  }

  /**
   * Trigger Readwise sync via Inngest
   */
  async triggerReadwiseSync() {
    try {
      const { error } = await this.client
        .functions
        .invoke('trigger-readwise');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error triggering Readwise sync', error);
      throw error;
    }
  }

  /**
   * Trigger Airtable import via Inngest
   */
  async triggerAirtableImport() {
    try {
      const { error } = await this.client
        .functions
        .invoke('trigger-airtable-import');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    } catch (error) {
      console.error('Error triggering Airtable import', error);
      throw error;
    }
  }
} 