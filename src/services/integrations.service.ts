import { getRepositories } from '@/repositories';
import { handleServiceItemError } from '@/lib/errors';

/**
 * Interface for Airtable settings
 */
export interface AirtableSettings {
  apiKey: string | null;
  baseId: string | null;
  tableId: string | null;
}

/**
 * Interface for Readwise settings
 */
export interface ReadwiseSettings {
  accessToken: string | null;
  lastSync: string | null;
}

/**
 * Type for Readwise connection test data
 */
export interface ReadwiseConnectionTestData {
  userId: string;
  apiKey: string;
}

/**
 * Type for Readwise sync data
 */
export interface ReadwiseSyncData {
  userId: string;
  apiKey: string;
  fullSync?: boolean;
}

/**
 * Service for managing integrations
 */
export const integrationsService = {
  /**
   * Get Airtable integration settings
   */
  async getAirtableSettings(): Promise<AirtableSettings> {
    try {
      const repo = getRepositories().integrations;
      return await repo.getAirtableSettings();
    } catch (error) {
      return handleServiceItemError<AirtableSettings>(error, 'Error in integrationsService.getAirtableSettings') || {
        apiKey: null,
        baseId: null,
        tableId: null
      };
    }
  },

  /**
   * Update Airtable integration settings
   */
  async updateAirtableSettings(settings: {
    apiKey?: string;
    baseId?: string;
    tableId?: string;
  }): Promise<boolean> {
    try {
      const repo = getRepositories().integrations;
      return await repo.updateAirtableSettings(settings);
    } catch (error) {
      console.error('Error in integrationsService.updateAirtableSettings:', error);
      return false;
    }
  },

  /**
   * Get Readwise integration settings
   */
  async getReadwiseSettings(): Promise<ReadwiseSettings> {
    try {
      const repo = getRepositories().integrations;
      return await repo.getReadwiseSettings();
    } catch (error) {
      return handleServiceItemError<ReadwiseSettings>(error, 'Error in integrationsService.getReadwiseSettings') || {
        accessToken: null,
        lastSync: null
      };
    }
  },

  /**
   * Update Readwise integration settings
   */
  async updateReadwiseSettings(settings: {
    accessToken?: string;
    lastSync?: string;
  }): Promise<boolean> {
    try {
      const repo = getRepositories().integrations;
      return await repo.updateReadwiseSettings(settings);
    } catch (error) {
      console.error('Error in integrationsService.updateReadwiseSettings:', error);
      return false;
    }
  },

  /**
   * Check if Airtable integration is configured
   */
  async isAirtableConfigured(): Promise<boolean> {
    try {
      const settings = await this.getAirtableSettings();
      return !!(settings.apiKey && settings.baseId && settings.tableId);
    } catch (error) {
      console.error('Error in integrationsService.isAirtableConfigured:', error);
      return false;
    }
  },

  /**
   * Check if Readwise integration is configured
   */
  async isReadwiseConfigured(): Promise<boolean> {
    try {
      const settings = await this.getReadwiseSettings();
      return !!settings.accessToken;
    } catch (error) {
      console.error('Error in integrationsService.isReadwiseConfigured:', error);
      return false;
    }
  },

  /**
   * Trigger Readwise sync
   */
  async triggerReadwiseSync(): Promise<boolean> {
    try {
      const repo = getRepositories().integrations;
      return await repo.triggerReadwiseSync();
    } catch (error) {
      console.error('Error in integrationsService.triggerReadwiseSync:', error);
      return false;
    }
  },

  /**
   * Validate Readwise connection test data
   */
  validateReadwiseConnectionData(
    userId: string, 
    apiKey: string
  ): { valid: boolean; error?: string } {
    try {
      // Validate required parameters
      if (!userId) {
        return { valid: false, error: 'User ID is required' };
      }
      
      if (!apiKey) {
        return { valid: false, error: 'API key is required' };
      }
      
      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error during validation';
      
      return { valid: false, error: errorMessage };
    }
  },
  
  /**
   * Prepare Readwise connection test data
   */
  prepareReadwiseConnectionData(
    userId: string, 
    apiKey: string
  ): ReadwiseConnectionTestData {
    return {
      userId,
      apiKey
    };
  },

  /**
   * Validate Readwise sync data
   */
  validateReadwiseSyncData(
    userId: string, 
    apiKey: string,
    fullSync?: boolean
  ): { valid: boolean; error?: string } {
    try {
      // Validate required parameters (reusing connection test validation)
      const baseValidation = this.validateReadwiseConnectionData(userId, apiKey);
      if (!baseValidation.valid) {
        return baseValidation;
      }
      
      // Additional validation can be added here for sync-specific requirements
      
      return { valid: true };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error during validation';
      
      return { valid: false, error: errorMessage };
    }
  },
  
  /**
   * Prepare Readwise sync data
   */
  prepareReadwiseSyncData(
    userId: string, 
    apiKey: string,
    fullSync: boolean = false
  ): ReadwiseSyncData {
    return {
      userId,
      apiKey,
      fullSync
    };
  },

  /**
   * Trigger Airtable import
   */
  async triggerAirtableImport(): Promise<boolean> {
    try {
      const repo = getRepositories().integrations;
      return await repo.triggerAirtableImport();
    } catch (error) {
      console.error('Error in integrationsService.triggerAirtableImport:', error);
      return false;
    }
  }
}; 