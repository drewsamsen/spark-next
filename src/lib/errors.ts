/**
 * Base error class for all service-layer errors.
 * Extends Error with additional code and details properties for structured error handling.
 * 
 * USE IN: Service and repository layers for business logic and data access errors
 * EXTENDS: Use DatabaseError, AuthError, NotFoundError, or ValidationError for specific error types
 * 
 * BEHAVIOR:
 * - Provides structured error information with code and optional details
 * - Can be caught and handled differently based on error type
 * - Details property useful for debugging and logging
 * 
 * @param message - Human-readable error description
 * @param code - Error code for programmatic handling (default: 'SERVICE_ERROR')
 * @param details - Optional additional error context (e.g., validation failures, stack traces)
 * 
 * @example
 * // Using base ServiceError
 * throw new ServiceError('Unable to process request', 'PROCESSING_ERROR', { userId: '123' });
 * 
 * @example
 * // Catching specific error types
 * try {
 *   await service.doSomething();
 * } catch (error) {
 *   if (error instanceof DatabaseError) {
 *     // Handle database-specific error
 *   } else if (error instanceof ServiceError) {
 *     // Handle generic service error
 *   }
 * }
 */
export class ServiceError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string = 'SERVICE_ERROR', details?: any) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Error class for database operation failures.
 * 
 * USE IN: Repository layer when database queries fail
 * USE WHEN: Supabase queries throw errors, connection issues, constraint violations
 * 
 * @param message - Description of the database error
 * @param details - Optional error context (e.g., query details, constraint names)
 * 
 * @example
 * // In a repository method
 * async getById(id: string): Promise<Spark | null> {
 *   try {
 *     const { data, error } = await this.client.from('sparks').select('*').eq('id', id);
 *     if (error) throw new DatabaseError('Failed to fetch spark', { id, error });
 *     return data;
 *   } catch (error) {
 *     throw new DatabaseError('Database query failed', error);
 *   }
 * }
 */
export class DatabaseError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

/**
 * Error class for authentication and authorization failures.
 * 
 * USE IN: Service and repository layers when auth checks fail
 * USE WHEN: User not authenticated, session expired, insufficient permissions
 * 
 * NOTE: When caught in component layer, typically redirects to login page
 * 
 * @param message - Description of the auth error (default: 'User not authenticated')
 * @param details - Optional error context (e.g., required permissions, user ID)
 * 
 * @example
 * // In a service method requiring authentication
 * async createSpark(data: CreateSparkData): Promise<Spark> {
 *   const user = await this.authService.getCurrentUser();
 *   if (!user) {
 *     throw new AuthError('Must be logged in to create sparks');
 *   }
 *   // ... create spark
 * }
 * 
 * @example
 * // In a repository with permission check
 * async update(id: string, userId: string, data: UpdateData): Promise<void> {
 *   const existing = await this.getById(id);
 *   if (existing.userId !== userId) {
 *     throw new AuthError('Unauthorized to update this resource', { id, userId });
 *   }
 *   // ... update resource
 * }
 */
export class AuthError extends ServiceError {
  constructor(message: string = 'User not authenticated', details?: any) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'AuthError';
  }
}

/**
 * Error class for resource not found scenarios.
 * 
 * USE IN: Service and repository layers when requested resources don't exist
 * USE WHEN: Database query returns null/empty for a specific ID lookup
 * DO NOT USE: For empty collection results (return empty array instead)
 * 
 * NOTE: When caught in component layer, typically shows "not found" message or 404 page
 * 
 * @param message - Description of what was not found
 * @param details - Optional context (e.g., ID that was not found, search criteria)
 * 
 * @example
 * // In a service method
 * async getSparkById(id: string): Promise<Spark> {
 *   const spark = await this.repository.getById(id);
 *   if (!spark) {
 *     throw new NotFoundError(`Spark not found with id: ${id}`, { id });
 *   }
 *   return spark;
 * }
 * 
 * @example
 * // When a specific resource is required
 * async updateBook(id: string, data: UpdateBookData): Promise<Book> {
 *   const book = await this.repository.getById(id);
 *   if (!book) {
 *     throw new NotFoundError(`Cannot update book: not found`, { id });
 *   }
 *   return await this.repository.update(id, data);
 * }
 */
export class NotFoundError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

/**
 * Error class for data validation failures.
 * 
 * USE IN: Service layer for business logic validation before database operations
 * USE WHEN: Input data fails validation rules, required fields missing, invalid formats
 * 
 * NOTE: Details property should contain specific validation failures for user feedback
 * 
 * @param message - High-level validation error description
 * @param details - Specific validation failures (e.g., { email: 'Invalid format', title: 'Required' })
 * 
 * @example
 * // In a service method with validation
 * async createSpark(data: CreateSparkData): Promise<Spark> {
 *   const errors: Record<string, string> = {};
 *   
 *   if (!data.title?.trim()) {
 *     errors.title = 'Title is required';
 *   }
 *   if (data.title && data.title.length > 200) {
 *     errors.title = 'Title must be 200 characters or less';
 *   }
 *   
 *   if (Object.keys(errors).length > 0) {
 *     throw new ValidationError('Invalid spark data', errors);
 *   }
 *   
 *   return await this.repository.create(data);
 * }
 * 
 * @example
 * // Catching validation errors in component layer
 * try {
 *   await sparksService.createSpark(formData);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     // Show field-specific errors to user
 *     setFieldErrors(error.details);
 *   }
 * }
 */
export class ValidationError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Handle errors in service layer methods that return collections.
 * Returns empty array on error with logging to console.
 * 
 * USE IN: Service class methods that return arrays (e.g., getAll, search, filter)
 * DO NOT USE IN: React components or hooks (use handleHookCollectionError instead)
 * 
 * BEHAVIOR:
 * - Logs error to console with context for debugging
 * - Returns empty array for safe fallback
 * - Does NOT show toast notifications (service layer is silent)
 * - ServiceError instances log message and details separately
 * 
 * @param error - The error that occurred
 * @param context - Descriptive context for logging (e.g., 'SparksService.getAll')
 * @returns Empty array of type T for safe fallback in service methods
 * 
 * @example
 * // In a service method returning a collection
 * async getSparks(): Promise<SparkDomain[]> {
 *   try {
 *     return await this.repository.getAll();
 *   } catch (error) {
 *     return handleServiceError<SparkDomain>(error, 'SparksService.getSparks');
 *   }
 * }
 * 
 * @example
 * // In a search method
 * async searchByTag(tag: string): Promise<Spark[]> {
 *   try {
 *     return await this.repository.findByTag(tag);
 *   } catch (error) {
 *     return handleServiceError<Spark>(error, 'SparksService.searchByTag');
 *   }
 * }
 * 
 * @see handleHookCollectionError for hook layer error handling with toast notifications
 */
export function handleServiceError<T>(error: any, context: string): T[] {
  if (error instanceof ServiceError) {
    console.error(`${context}:`, error.message, error.details);
  } else {
    console.error(`${context}:`, error);
  }
  return [] as T[];
}

/**
 * Handle errors in service layer methods that return a single item or null.
 * Returns null on error with logging to console.
 * 
 * USE IN: Service class methods that return single items or null (e.g., getById, findOne)
 * DO NOT USE IN: React components or hooks (use handleHookError instead)
 * 
 * BEHAVIOR:
 * - Logs error to console with context for debugging
 * - Returns null for safe fallback
 * - Does NOT show toast notifications (service layer is silent)
 * - ServiceError instances log message and details separately
 * 
 * @param error - The error that occurred
 * @param context - Descriptive context for logging (e.g., 'SparksService.getById')
 * @returns null for safe fallback in service methods
 * 
 * @example
 * // In a service method returning a single item
 * async getSparkById(id: string): Promise<Spark | null> {
 *   try {
 *     return await this.repository.getById(id);
 *   } catch (error) {
 *     return handleServiceItemError<Spark>(error, 'SparksService.getById');
 *   }
 * }
 * 
 * @example
 * // In a lookup method
 * async findBySlug(slug: string): Promise<Category | null> {
 *   try {
 *     return await this.repository.findBySlug(slug);
 *   } catch (error) {
 *     return handleServiceItemError<Category>(error, 'CategoryService.findBySlug');
 *   }
 * }
 * 
 * @see handleHookError for hook layer error handling with toast notifications
 */
export function handleServiceItemError<T>(error: any, context: string): T | null {
  if (error instanceof ServiceError) {
    console.error(`${context}:`, error.message, error.details);
  } else {
    console.error(`${context}:`, error);
  }
  return null;
} 