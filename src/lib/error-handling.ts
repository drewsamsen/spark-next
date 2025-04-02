import { toast } from 'react-toastify';
import { ServiceError, AuthError, NotFoundError, ValidationError, DatabaseError } from './errors';

/**
 * A type for error handling options
 */
export interface ErrorHandlingOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  context?: string;
  fallbackMessage?: string;
}

/**
 * Default error handling options
 */
const defaultOptions: ErrorHandlingOptions = {
  showToast: true,
  logToConsole: true,
  fallbackMessage: 'An unexpected error occurred'
};

/**
 * Get an appropriate error message based on the error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ServiceError) {
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'An unexpected error occurred';
  }
}

/**
 * Get an appropriate toast type based on the error
 */
export function getToastType(error: unknown): 'error' | 'warning' | 'info' {
  if (error instanceof AuthError) {
    return 'warning';
  } else if (error instanceof NotFoundError) {
    return 'info';
  } else {
    return 'error';
  }
}

/**
 * Handle an error with standardized logging and toast notifications
 * @param error The error to handle
 * @param options Error handling options
 * @returns The original error for chaining
 */
export function handleError(error: unknown, options: ErrorHandlingOptions = {}): unknown {
  const opts = { ...defaultOptions, ...options };
  const message = getErrorMessage(error) || opts.fallbackMessage as string;
  const contextPrefix = opts.context ? `[${opts.context}] ` : '';
  
  // Log to console if enabled
  if (opts.logToConsole) {
    if (error instanceof ServiceError) {
      console.error(`${contextPrefix}${error.name}:`, message, error.details);
    } else {
      console.error(`${contextPrefix}Error:`, error);
    }
  }
  
  // Show toast notification if enabled
  if (opts.showToast) {
    const toastType = getToastType(error);
    toast[toastType](message);
  }
  
  return error;
}

/**
 * Hook-friendly error handler that returns null for singleton results
 * @param error The error to handle
 * @param options Error handling options
 * @returns null for use in hook returns
 */
export function handleHookError<T>(error: unknown, options: ErrorHandlingOptions = {}): T | null {
  handleError(error, options);
  return null;
}

/**
 * Hook-friendly error handler that returns empty array for collection results
 * @param error The error to handle
 * @param options Error handling options
 * @returns Empty array for use in hook returns
 */
export function handleHookCollectionError<T>(error: unknown, options: ErrorHandlingOptions = {}): T[] {
  handleError(error, options);
  return [] as T[];
}

/**
 * Creates a standardized try/catch block for async functions
 * @param fn The async function to execute
 * @param options Error handling options
 * @returns A promise that resolves to the result or null on error
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions = {}
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, options);
    return null;
  }
}

/**
 * Creates a standardized try/catch block for async functions returning collections
 * @param fn The async function to execute
 * @param options Error handling options
 * @returns A promise that resolves to the result or empty array on error
 */
export async function tryCatchCollection<T>(
  fn: () => Promise<T[]>,
  options: ErrorHandlingOptions = {}
): Promise<T[]> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, options);
    return [];
  }
} 