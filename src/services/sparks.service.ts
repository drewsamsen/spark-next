import { getRepositories } from '@/repositories';
import { CreateSparkInput, SparkDomain, EnhancedSparkItem, SidebarItem, SparkModel } from '@/lib/types';
import { formatDate } from '@/lib/db';
import { handleServiceError, handleServiceItemError } from '@/lib/errors';
import { BaseService } from './base.service';
import { SparksRepository } from '@/repositories/sparks.repository';

// Re-export the EnhancedSparkItem type
export type { EnhancedSparkItem };

/**
 * Service for handling sparks-related operations
 */
class SparksService extends BaseService<SparkModel, SparksRepository> {
  constructor() {
    super(getRepositories().sparks);
  }

  /**
   * Get all sparks for the current user with complete details
   */
  async getSparks(): Promise<EnhancedSparkItem[]> {
    try {
      // Fetch all sparks from the repository
      const sparksWithRelations = await this.repository.getSparks();
      
      // Transform the results into the expected format
      const enhancedSparks = sparksWithRelations.map(spark => {
        const sparkDomain = this.repository.mapToDomain(spark);
        const rawDate = sparkDomain.todoCreatedAt || sparkDomain.createdAt;
        
        return {
          id: sparkDomain.id,
          name: sparkDomain.body,
          date: formatDate(rawDate),
          sortDate: rawDate, // Store raw date for sorting
          details: sparkDomain
        };
      });
      
      return enhancedSparks;
    } catch (error) {
      return handleServiceError<EnhancedSparkItem>(error, 'Error in SparksService.getSparks');
    }
  }

  /**
   * Get detailed information for a single spark
   */
  async getSparkDetails(sparkId: string): Promise<SparkDomain | null> {
    try {
      const sparkWithRelations = await this.repository.getSparkById(sparkId);
      
      if (!sparkWithRelations) {
        return null;
      }
      
      return this.repository.mapToDomain(sparkWithRelations);
    } catch (error) {
      return handleServiceItemError<SparkDomain>(error, `Error in SparksService.getSparkDetails for spark ${sparkId}`);
    }
  }

  /**
   * Create a new spark
   */
  async createSpark(input: Omit<CreateSparkInput, 'md5Uid'>): Promise<SparkDomain | null> {
    try {
      // Generate a simple hash to avoid duplicates
      const md5Uid = await this.generateMd5Hash(input.body);
      
      // Create the spark
      const newSpark = await this.repository.createSpark({
        ...input,
        md5Uid
      });
      
      // Get the full details with relationships
      const sparkWithRelations = await this.repository.getSparkById(newSpark.id);
      
      if (!sparkWithRelations) {
        return null;
      }
      
      return this.repository.mapToDomain(sparkWithRelations);
    } catch (error) {
      return handleServiceItemError<SparkDomain>(error, 'Error in SparksService.createSpark');
    }
  }

  /**
   * Update an existing spark
   */
  async updateSpark(
    sparkId: string, 
    updates: Partial<Omit<CreateSparkInput, 'md5Uid'>>
  ): Promise<SparkDomain | null> {
    try {
      // Update the spark
      await this.repository.updateSpark(sparkId, updates);
      
      // Get the updated spark with relationships
      const sparkWithRelations = await this.repository.getSparkById(sparkId);
      
      if (!sparkWithRelations) {
        return null;
      }
      
      return this.repository.mapToDomain(sparkWithRelations);
    } catch (error) {
      return handleServiceItemError<SparkDomain>(error, `Error in SparksService.updateSpark for spark ${sparkId}`);
    }
  }

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
}

/**
 * Export a singleton instance of the SparksService
 */
export const sparksService = new SparksService(); 