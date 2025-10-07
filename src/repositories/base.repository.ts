import { AuthError, DatabaseError, NotFoundError } from '@/lib/errors';
import { DbClient, getCurrentUserId } from '@/lib/db';

/**
 * Base repository class providing common CRUD operations for all database entities.
 * 
 * EXTEND THIS CLASS when creating a new repository for database entities that need
 * standard create, read, update, delete operations with automatic user scoping.
 * 
 * KEY FEATURES:
 * - Automatic user_id scoping for all operations (RLS pattern)
 * - Built-in ownership verification for security
 * - Standard error handling with typed errors
 * - Extensible with custom queries
 * 
 * USE WHEN:
 * - Entity needs database persistence
 * - Entity follows user-scoped pattern (has user_id)
 * - Standard CRUD operations are needed
 * 
 * EXTEND WITH CUSTOM METHODS when:
 * - Entity needs complex queries beyond CRUD
 * - Entity needs joins with other tables
 * - Entity needs specialized filtering or sorting
 * 
 * @template T - The database model type (must have user_id field)
 * 
 * @example
 * // Basic extension with standard CRUD only
 * export class SparksRepository extends BaseRepository<SparkModel> {
 *   constructor(client: DbClient) {
 *     super(client, 'sparks');
 *   }
 *   
 *   // Inherits: getAll(), getById(), create(), update(), delete()
 * }
 * 
 * @example
 * // Extension with custom queries
 * export class NotesRepository extends BaseRepository<NoteModel> {
 *   constructor(client: DbClient) {
 *     super(client, 'notes');
 *   }
 *   
 *   // Add custom query with joins
 *   async getNotesWithHighlights(): Promise<NoteWithHighlights[]> {
 *     const userId = await this.getUserId();
 *     const { data, error } = await this.client
 *       .from(this.tableName)
 *       .select('*, highlights(*)')
 *       .eq('user_id', userId);
 *     
 *     if (error) {
 *       throw new DatabaseError('Error fetching notes with highlights', error);
 *     }
 *     
 *     return data as NoteWithHighlights[];
 *   }
 * }
 * 
 * @see {@link DbClient} for connection configuration
 * @see /docs/architecture/REPOSITORY-PATTERN.md for detailed patterns and best practices
 */
export abstract class BaseRepository<T extends Record<string, any>> {
  protected client: DbClient;
  protected tableName: string;
  
  constructor(client: DbClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }
  
  /**
   * Get the current authenticated user ID from the session.
   * 
   * USE IN: Custom repository methods to scope queries to current user
   * 
   * NOTE: This is automatically called by all base CRUD methods.
   * Only call manually in custom repository methods.
   * 
   * @returns The authenticated user's ID
   * @throws {AuthError} If no user is authenticated or session is invalid
   * 
   * @example
   * // In a custom repository method
   * async getSparksByCategory(categoryId: string): Promise<SparkModel[]> {
   *   const userId = await this.getUserId();
   *   const { data, error } = await this.client
   *     .from(this.tableName)
   *     .select('*')
   *     .eq('user_id', userId)
   *     .eq('category_id', categoryId);
   *   // ...
   * }
   */
  protected async getUserId(): Promise<string> {
    return getCurrentUserId(this.client);
  }
  
  /**
   * Check if a record exists and belongs to the current user.
   * 
   * USE IN: Custom repository methods when you need to verify ownership without throwing
   * USE verifyUserOwnership() WHEN: You want automatic error throwing on failed ownership
   * 
   * NOTE: Returns false for both non-existent records AND records owned by other users.
   * This prevents information disclosure about existence of other users' data.
   * 
   * @param table - Database table name to check
   * @param id - Record ID to verify
   * @param userId - Optional user ID (fetched from session if omitted)
   * @returns True if record exists and belongs to user, false otherwise
   * @throws {DatabaseError} If database query fails
   * @throws {AuthError} If userId is not provided and session is invalid
   * 
   * @example
   * // Check ownership before performing optional operation
   * async archiveSparkIfOwned(sparkId: string): Promise<boolean> {
   *   const isOwned = await this.checkUserOwnership('sparks', sparkId);
   *   if (!isOwned) {
   *     return false; // Silently skip if not owned
   *   }
   *   // Proceed with archive operation
   *   await this.update(sparkId, { archived: true });
   *   return true;
   * }
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
   * Verify that a record exists and belongs to the current user, throwing if not.
   * 
   * USE IN: update() and delete() operations to ensure security
   * USE checkUserOwnership() WHEN: You want a boolean check without throwing
   * 
   * NOTE: Used internally by update() and delete() methods.
   * Throws NotFoundError for both non-existent and unauthorized access
   * to prevent information disclosure.
   * 
   * @param table - Database table name to check
   * @param id - Record ID to verify
   * @param userId - Optional user ID (fetched from session if omitted)
   * @throws {NotFoundError} If record doesn't exist or user doesn't own it
   * @throws {DatabaseError} If database query fails
   * @throws {AuthError} If userId is not provided and session is invalid
   * 
   * @example
   * // Used internally by update/delete (you rarely call this directly)
   * async update(id: string, updates: Partial<T>): Promise<T> {
   *   const userId = await this.getUserId();
   *   await this.verifyUserOwnership(this.tableName, id, userId);
   *   // Proceed with update...
   * }
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
   * Generate a random UUID for new records.
   * 
   * USE IN: Custom repository methods when creating records with explicit IDs
   * 
   * NOTE: Most create operations don't need this as the database generates IDs.
   * Only use when you need to know the ID before insertion (e.g., for related records).
   * 
   * @returns A randomly generated UUID v4 string
   * 
   * @example
   * // Create parent and child records with explicit relationship
   * async createNoteWithHighlights(note: NoteInput, highlights: HighlightInput[]): Promise<Note> {
   *   const noteId = this.generateId();
   *   
   *   // Create note with explicit ID
   *   await this.create({ ...note, id: noteId });
   *   
   *   // Create highlights linked to note
   *   for (const highlight of highlights) {
   *     await highlightsRepo.create({ ...highlight, note_id: noteId });
   *   }
   *   
   *   return this.getById(noteId);
   * }
   */
  protected generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Get all records for the current authenticated user.
   * 
   * Automatically scopes query to current user's records only.
   * Returns all fields (SELECT *) from the table.
   * 
   * OVERRIDE THIS when you need:
   * - Custom field selection
   * - Joined data from related tables
   * - Special ordering or filtering
   * 
   * @returns Array of all records belonging to the current user
   * @throws {DatabaseError} If query fails
   * @throws {AuthError} If no user is authenticated
   * 
   * @example
   * // Using inherited method (no override needed)
   * const sparks = await sparksRepository.getAll();
   * 
   * @example
   * // Override for custom behavior
   * async getAll(): Promise<SparkModel[]> {
   *   const userId = await this.getUserId();
   *   const { data, error } = await this.client
   *     .from(this.tableName)
   *     .select('*, categories(name)')
   *     .eq('user_id', userId)
   *     .order('created_at', { ascending: false });
   *   
   *   if (error) throw new DatabaseError('Error fetching sparks', error);
   *   return data as SparkModel[];
   * }
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
   * Get a single record by ID if it belongs to the current authenticated user.
   * 
   * Automatically scopes to current user's records only for security.
   * Returns null if record doesn't exist OR belongs to another user.
   * 
   * NOTE: Returns null for both "not found" and "unauthorized" to prevent
   * information disclosure about existence of other users' data.
   * 
   * @param id - Unique identifier of the record to retrieve
   * @returns The record if found and owned by user, null otherwise
   * @throws {DatabaseError} If query fails (not for "not found" - that returns null)
   * @throws {AuthError} If no user is authenticated
   * 
   * @example
   * // Basic usage
   * const spark = await sparksRepository.getById('abc-123');
   * if (!spark) {
   *   throw new NotFoundError('Spark not found');
   * }
   * 
   * @example
   * // Override for joined data
   * async getById(id: string): Promise<NoteModel | null> {
   *   const userId = await this.getUserId();
   *   const { data, error } = await this.client
   *     .from(this.tableName)
   *     .select('*, highlights(*)')
   *     .eq('id', id)
   *     .eq('user_id', userId)
   *     .single();
   *   
   *   if (error?.code === 'PGRST116') return null;
   *   if (error) throw new DatabaseError('Error fetching note', error);
   *   return data as NoteModel;
   * }
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
   * Create a new record for the current authenticated user.
   * 
   * Automatically sets user_id to the current authenticated user.
   * Returns the created record with all database-generated fields (id, created_at, etc.).
   * 
   * NOTE: Any user_id in the input is ignored and replaced with current user's ID.
   * This prevents users from creating records for other users.
   * 
   * @param input - Partial record data (id, user_id, created_at auto-generated)
   * @returns The created record with all fields populated
   * @throws {DatabaseError} If creation fails (constraint violations, invalid data, etc.)
   * @throws {AuthError} If no user is authenticated
   * 
   * @example
   * // Basic creation
   * const newSpark = await sparksRepository.create({
   *   title: 'New idea',
   *   content: 'This is a great idea',
   *   category_id: 'abc-123'
   * });
   * // Returns: { id: '...', title: 'New idea', user_id: '...', created_at: '...' }
   * 
   * @example
   * // Override for validation or transformation
   * async create(input: Partial<SparkModel>): Promise<SparkModel> {
   *   // Validate before creation
   *   if (!input.title?.trim()) {
   *     throw new ValidationError('Title is required');
   *   }
   *   
   *   // Transform data
   *   const normalized = {
   *     ...input,
   *     title: input.title.trim(),
   *     slug: slugify(input.title)
   *   };
   *   
   *   return super.create(normalized);
   * }
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
   * Update an existing record if it belongs to the current authenticated user.
   * 
   * Automatically verifies ownership before updating (throws if not owned).
   * Automatically sets updated_at to current timestamp.
   * 
   * NOTE: Only updates records owned by current user for security.
   * Throws NotFoundError for both non-existent and unauthorized access.
   * 
   * @param id - Unique identifier of the record to update
   * @param updates - Partial record data with fields to update
   * @returns The updated record with all current field values
   * @throws {NotFoundError} If record doesn't exist or user doesn't own it
   * @throws {DatabaseError} If update fails (constraint violations, etc.)
   * @throws {AuthError} If no user is authenticated
   * 
   * @example
   * // Basic update
   * const updated = await sparksRepository.update('abc-123', {
   *   title: 'Updated title',
   *   content: 'Updated content'
   * });
   * // Returns full record with updated_at automatically set
   * 
   * @example
   * // Override for additional validation
   * async update(id: string, updates: Partial<SparkModel>): Promise<SparkModel> {
   *   // Validate updates
   *   if (updates.title !== undefined && !updates.title.trim()) {
   *     throw new ValidationError('Title cannot be empty');
   *   }
   *   
   *   // Add computed fields
   *   if (updates.title) {
   *     updates.slug = slugify(updates.title);
   *   }
   *   
   *   return super.update(id, updates);
   * }
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
   * Delete a record if it belongs to the current authenticated user.
   * 
   * Automatically verifies ownership before deleting (throws if not owned).
   * Returns nothing on success.
   * 
   * NOTE: Only deletes records owned by current user for security.
   * Throws NotFoundError for both non-existent and unauthorized access.
   * 
   * WARNING: This performs hard delete. Consider soft delete pattern for data retention.
   * 
   * @param id - Unique identifier of the record to delete
   * @throws {NotFoundError} If record doesn't exist or user doesn't own it
   * @throws {DatabaseError} If deletion fails (foreign key constraints, etc.)
   * @throws {AuthError} If no user is authenticated
   * 
   * @example
   * // Basic deletion
   * await sparksRepository.delete('abc-123');
   * // No return value, throws on error
   * 
   * @example
   * // Safe deletion with error handling
   * try {
   *   await sparksRepository.delete(sparkId);
   *   console.log('Spark deleted successfully');
   * } catch (error) {
   *   if (error instanceof NotFoundError) {
   *     console.log('Spark not found or access denied');
   *   } else {
   *     console.error('Failed to delete:', error);
   *   }
   * }
   * 
   * @example
   * // Override for soft delete pattern
   * async delete(id: string): Promise<void> {
   *   // Soft delete by setting deleted_at instead of removing
   *   await this.update(id, { 
   *     deleted_at: new Date().toISOString() 
   *   } as Partial<T>);
   * }
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