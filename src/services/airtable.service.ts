import { getRepositories } from '@/repositories';
import { handleServiceError, handleServiceItemError } from '@/lib/errors';

/**
 * Type for Airtable import data
 */
export interface AirtableImportData {
  userId: string;
  apiKey: string;
  baseId: string;
  tableId: string;
}

/**
 * Service for handling Airtable operations
 */
export const airtableService = {
  /**
   * Validate Airtable import data
   */
  validateImportData(
    userId: string, 
    apiKey: string, 
    baseId: string, 
    tableId: string
  ): { valid: boolean; error?: string } {
    try {
      // Validate required parameters
      if (!userId) {
        return { valid: false, error: 'User ID is required' };
      }
      
      if (!apiKey) {
        return { valid: false, error: 'API key is required' };
      }
      
      if (!baseId) {
        return { valid: false, error: 'Base ID is required' };
      }
      
      if (!tableId) {
        return { valid: false, error: 'Table ID is required' };
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
   * Prepare Airtable import data
   */
  prepareImportData(
    userId: string, 
    apiKey: string, 
    baseId: string, 
    tableId: string
  ): AirtableImportData {
    return {
      userId,
      apiKey,
      baseId,
      tableId
    };
  }
}; 