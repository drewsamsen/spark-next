import { AuthError, DatabaseError, NotFoundError } from '@/lib/errors';
import { DbClient, getCurrentUserId } from '@/lib/db';

/**
 * Base repository class with common functionality
 */
export abstract class BaseRepository {
  protected client: DbClient;
  
  constructor(client: DbClient) {
    this.client = client;
  }
  
  /**
   * Get the current user ID from session
   */
  protected async getUserId(): Promise<string> {
    return getCurrentUserId(this.client);
  }
  
  /**
   * Check if a record exists and belongs to the current user
   * @param table The table to check
   * @param id The record ID
   * @param userId Optional user ID (will be fetched from session if not provided)
   * @returns True if the record exists and belongs to the user
   */
  protected async checkUserOwnership(
    table: string, 
    id: string, 
    userId?: string
  ): Promise<boolean> {
    const ownerId = userId || await this.getUserId();
    
    const { data, error } = await this.client
      .from(table)
      .select('id')
      .eq('id', id)
      .eq('user_id', ownerId)
      .maybeSingle();
    
    if (error) {
      throw new DatabaseError(`Error checking ownership for ${table}`, error);
    }
    
    return !!data;
  }
  
  /**
   * Verify that a record exists and belongs to the current user
   * @param table The table to check
   * @param id The record ID
   * @param userId Optional user ID (will be fetched from session if not provided)
   * @throws NotFoundError if the record doesn't exist or doesn't belong to the user
   */
  protected async verifyUserOwnership(
    table: string, 
    id: string, 
    userId?: string
  ): Promise<void> {
    const exists = await this.checkUserOwnership(table, id, userId);
    
    if (!exists) {
      throw new NotFoundError(`${table} with id ${id} not found or access denied`);
    }
  }
  
  /**
   * Shared method to generate a random UUID
   * @returns A randomly generated UUID string
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }
} 