import { getRepositories } from '@/repositories';
import { SparkDomain, CreateSparkInput } from '@/repositories/sparks.repository';
import { formatDate } from '@/lib/db';
import { SidebarItem } from '@/lib/types';
import { handleServiceError, handleServiceItemError } from '@/lib/errors';

/**
 * Extended interface that combines SidebarItem with SparkDetails
 */
export interface EnhancedSparkItem extends SidebarItem {
  details: SparkDomain;
}

/**
 * Service for handling sparks-related operations
 */
export const sparksService = {
  /**
   * Get all sparks for the current user with complete details
   */
  async getSparks(): Promise<EnhancedSparkItem[]> {
    try {
      const repo = getRepositories().sparks;
      
      // Fetch all sparks from the repository
      const sparksWithRelations = await repo.getSparks();
      
      // Transform the results into the expected format
      const enhancedSparks = sparksWithRelations.map(spark => {
        const sparkDomain = repo.mapToDomain(spark);
        
        return {
          id: sparkDomain.id,
          name: sparkDomain.body,
          date: formatDate(sparkDomain.todoCreatedAt || sparkDomain.createdAt),
          details: sparkDomain
        };
      });
      
      return enhancedSparks;
    } catch (error) {
      return handleServiceError<EnhancedSparkItem>(error, 'Error in sparksService.getSparks');
    }
  },

  /**
   * Get detailed information for a single spark
   */
  async getSparkDetails(sparkId: string): Promise<SparkDomain | null> {
    try {
      const repo = getRepositories().sparks;
      
      const sparkWithRelations = await repo.getSparkById(sparkId);
      
      if (!sparkWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(sparkWithRelations);
    } catch (error) {
      return handleServiceItemError<SparkDomain>(error, `Error in sparksService.getSparkDetails for spark ${sparkId}`);
    }
  },

  /**
   * Create a new spark
   */
  async createSpark(input: Omit<CreateSparkInput, 'md5Uid'>): Promise<SparkDomain | null> {
    try {
      const repo = getRepositories().sparks;
      
      // Generate a simple hash to avoid duplicates
      const md5Uid = await this.generateMd5Hash(input.body);
      
      // Create the spark
      const newSpark = await repo.createSpark({
        ...input,
        md5Uid
      });
      
      // Get the full details with relationships
      const sparkWithRelations = await repo.getSparkById(newSpark.id);
      
      if (!sparkWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(sparkWithRelations);
    } catch (error) {
      return handleServiceItemError<SparkDomain>(error, 'Error in sparksService.createSpark');
    }
  },

  /**
   * Update an existing spark
   */
  async updateSpark(
    sparkId: string, 
    updates: Partial<Omit<CreateSparkInput, 'md5Uid'>>
  ): Promise<SparkDomain | null> {
    try {
      const repo = getRepositories().sparks;
      
      // Update the spark
      await repo.updateSpark(sparkId, updates);
      
      // Get the updated spark with relationships
      const sparkWithRelations = await repo.getSparkById(sparkId);
      
      if (!sparkWithRelations) {
        return null;
      }
      
      return repo.mapToDomain(sparkWithRelations);
    } catch (error) {
      return handleServiceItemError<SparkDomain>(error, `Error in sparksService.updateSpark for spark ${sparkId}`);
    }
  },

  /**
   * Delete a spark
   */
  async deleteSpark(sparkId: string): Promise<boolean> {
    try {
      const repo = getRepositories().sparks;
      
      await repo.deleteSpark(sparkId);
      return true;
    } catch (error) {
      console.error(`Error in sparksService.deleteSpark for spark ${sparkId}:`, error);
      return false;
    }
  },

  /**
   * Generate an MD5 hash from a string
   * Used to avoid duplicate sparks
   */
  async generateMd5Hash(text: string): Promise<string> {
    // Use the browser's crypto API for hashing
    if (typeof window !== 'undefined' && window.crypto && 'subtle' in window.crypto) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hash = await window.crypto.subtle.digest('SHA-256', data);
      
      // Convert the hash to a hex string
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    // Fallback to a simple hash function for server-side
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}; 