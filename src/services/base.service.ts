import { BaseRepository } from '@/repositories/base.repository';
import { handleServiceError, handleServiceItemError } from '@/lib/errors';

/**
 * Base service abstract class with common service methods and error handling
 * @template T - Entity type
 * @template R - Repository type
 */
export abstract class BaseService<T extends Record<string, any>, R extends BaseRepository<T>> {
  protected repository: R;
  
  constructor(repository: R) {
    this.repository = repository;
  }
  
  /**
   * Get all entities
   */
  async getAll(): Promise<T[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      return handleServiceError<T>(error, `Error in ${this.constructor.name}.getAll`);
    }
  }
  
  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const entity = await this.repository.getById(id);
      return entity;
    } catch (error) {
      return handleServiceItemError<T>(error, `Error in ${this.constructor.name}.getById for ID ${id}`);
    }
  }
  
  /**
   * Create new entity
   */
  async create(input: Partial<T>): Promise<T | null> {
    try {
      const entity = await this.repository.create(input);
      return entity;
    } catch (error) {
      return handleServiceItemError<T>(error, `Error in ${this.constructor.name}.create`);
    }
  }
  
  /**
   * Update entity by ID
   */
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    try {
      const entity = await this.repository.update(id, updates);
      return entity;
    } catch (error) {
      return handleServiceItemError<T>(error, `Error in ${this.constructor.name}.update for ID ${id}`);
    }
  }
  
  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.repository.delete(id);
      return true;
    } catch (error) {
      console.error(`Error in ${this.constructor.name}.delete for ID ${id}:`, error);
      return false;
    }
  }
} 