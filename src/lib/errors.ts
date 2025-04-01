/**
 * Custom error class for service-related errors
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
 * Custom error class for database-related errors
 */
export class DatabaseError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

/**
 * Custom error class for authentication-related errors
 */
export class AuthError extends ServiceError {
  constructor(message: string = 'User not authenticated', details?: any) {
    super(message, 'AUTH_ERROR', details);
    this.name = 'AuthError';
  }
}

/**
 * Custom error class for not found errors
 */
export class NotFoundError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Helper function to handle errors in service methods that return collections
 * Returns an empty array and logs the error
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
 * Helper function to handle errors in service methods that return a single item
 * Returns null and logs the error
 */
export function handleServiceItemError<T>(error: any, context: string): T | null {
  if (error instanceof ServiceError) {
    console.error(`${context}:`, error.message, error.details);
  } else {
    console.error(`${context}:`, error);
  }
  return null;
} 