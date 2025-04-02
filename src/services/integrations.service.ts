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