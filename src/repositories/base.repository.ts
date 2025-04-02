import { AuthError, DatabaseError, NotFoundError } from '@/lib/errors';
import { DbClient, getCurrentUserId } from '@/lib/db';

/**
 * Base repository class with common functionality for data access
 */
export abstract class BaseRepository<T extends Record<string, any>> {
  protected client: DbClient;
  protected tableName: string;
  
  constructor(client: DbClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
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

  /**
   * Get all records for the current user
   */
  async getAll(): Promise<T[]> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error fetching ${this.tableName}`, error);
    }
    
    return data as T[];
  }

  /**
   * Get a record by ID if it belongs to the current user
   */
  async getById(id: string): Promise<T | null> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError(`Error fetching ${this.tableName} with ID ${id}`, error);
    }
    
    return data as T;
  }

  /**
   * Create a new record
   */
  async create(input: Partial<T>): Promise<T> {
    const userId = await this.getUserId();
    
    const { data, error } = await this.client
      .from(this.tableName)
      .insert({
        ...input,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError(`Error creating ${this.tableName}`, error);
    }
    
    return data as T;
  }

  /**
   * Update an existing record if it belongs to the current user
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    const userId = await this.getUserId();
    
    // Verify the record exists and belongs to this user
    await this.verifyUserOwnership(this.tableName, id, userId);
    
    const { data, error } = await this.client
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw new DatabaseError(`Error updating ${this.tableName} with ID ${id}`, error);
    }
    
    return data as T;
  }

  /**
   * Delete a record if it belongs to the current user
   */
  async delete(id: string): Promise<void> {
    const userId = await this.getUserId();
    
    // Verify the record exists and belongs to this user
    await this.verifyUserOwnership(this.tableName, id, userId);
    
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      throw new DatabaseError(`Error deleting ${this.tableName} with ID ${id}`, error);
    }
  }
} 