import { toast } from 'react-toastify';
import { ServiceError, AuthError, NotFoundError, ValidationError, DatabaseError } from './errors';

/**
 * Configuration options for error handling behavior across component and hook layers.
 * Controls logging, toast notifications, and error messaging.
 * 
 * @property showToast - Whether to display toast notification to user (default: true)
 * @property logToConsole - Whether to log error to console (default: true)
 * @property context - Descriptive context prefix for logs (e.g., 'CreateSparkForm.handleSubmit')
 * @property fallbackMessage - Message to show if error message cannot be extracted
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
 * Extract a user-friendly error message from any error type.
 * Handles ServiceError, Error, string, and unknown error types.
 * 
 * USE IN: Component and hook layers when displaying errors to users
 * 
 * @param error - Error of any type (ServiceError, Error, string, or unknown)
 * @returns User-friendly error message string
 * 
 * @example
 * // In a component error handler
 * catch (error) {
 *   const message = getErrorMessage(error);
 *   setErrorMessage(message);
 * }
 * 
 * @example
 * // With different error types
 * getErrorMessage(new AuthError('Not logged in')); // Returns: 'Not logged in'
 * getErrorMessage(new Error('Failed')); // Returns: 'Failed'
 * getErrorMessage('Something went wrong'); // Returns: 'Something went wrong'
 * getErrorMessage(null); // Returns: 'An unexpected error occurred'
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
 * Determine the appropriate toast notification type based on error severity.
 * Maps error types to toast styles for better user experience.
 * 
 * USE IN: Component and hook layers when showing toast notifications
 * 
 * MAPPING:
 * - AuthError → 'warning' (user needs to take action)
 * - NotFoundError → 'info' (informational, not critical)
 * - All others → 'error' (critical/unexpected errors)
 * 
 * @param error - Error of any type
 * @returns Toast type: 'error', 'warning', or 'info'
 * 
 * @example
 * // Automatically used by handleError, but can be used directly
 * const toastType = getToastType(error);
 * toast[toastType](message);
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
 * Handle errors in component and hook layers with logging and user notifications.
 * Provides standardized error handling with toast notifications and console logging.
 * 
 * USE IN: React components and hooks for user-facing error handling
 * DO NOT USE IN: Service layer (services should be silent, use handleServiceError instead)
 * 
 * BEHAVIOR:
 * - Extracts user-friendly error message
 * - Logs to console with optional context prefix
 * - Shows toast notification to user (type varies by error)
 * - Returns original error for potential re-throwing or further handling
 * 
 * @param error - Error of any type to handle
 * @param options - Configuration for logging and notifications
 * @returns Original error object for chaining or re-throwing
 * 
 * @example
 * // In a component with default options (shows toast + logs)
 * async function handleDelete() {
 *   try {
 *     await sparksService.deleteSpark(id);
 *   } catch (error) {
 *     handleError(error, { context: 'SparkCard.handleDelete' });
 *   }
 * }
 * 
 * @example
 * // Suppress toast, log only
 * catch (error) {
 *   handleError(error, {
 *     showToast: false,
 *     context: 'BackgroundSync'
 *   });
 * }
 * 
 * @example
 * // With custom fallback message
 * catch (error) {
 *   handleError(error, {
 *     context: 'FileUpload',
 *     fallbackMessage: 'Failed to upload file'
 *   });
 * }
 * 
 * @see handleHookError for hook-friendly version that returns null
 * @see handleHookCollectionError for hook-friendly version that returns empty array
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
 * Handle errors in data hooks that return single items or null.
 * Combines error handling with appropriate return type for hooks.
 * 
 * USE IN: Data hooks (hooks/data/*) for methods returning single items
 * USE WHEN: Hook method should return null on error (e.g., getById, findOne)
 * 
 * BEHAVIOR:
 * - Calls handleError (logs to console + shows toast)
 * - Returns null for safe fallback in hook state
 * - Allows hook to gracefully handle errors without crashing component
 * 
 * @param error - Error that occurred in hook
 * @param options - Error handling configuration
 * @returns null for safe hook return value
 * 
 * @example
 * // In a data hook
 * export function useSpark(id: string) {
 *   const [spark, setSpark] = useState<Spark | null>(null);
 *   const [isLoading, setIsLoading] = useState(true);
 *   
 *   useEffect(() => {
 *     async function loadSpark() {
 *       try {
 *         const data = await sparksService.getById(id);
 *         setSpark(data);
 *       } catch (error) {
 *         setSpark(handleHookError<Spark>(error, { context: 'useSpark' }));
 *       } finally {
 *         setIsLoading(false);
 *       }
 *     }
 *     loadSpark();
 *   }, [id]);
 *   
 *   return { spark, isLoading };
 * }
 * 
 * @see handleHookCollectionError for hooks returning arrays
 * @see handleServiceItemError for service layer (no toast notifications)
 */
export function handleHookError<T>(error: unknown, options: ErrorHandlingOptions = {}): T | null {
  handleError(error, options);
  return null;
}

/**
 * Handle errors in data hooks that return collections.
 * Combines error handling with appropriate return type for array-returning hooks.
 * 
 * USE IN: Data hooks (hooks/data/*) for methods returning arrays
 * USE WHEN: Hook method should return empty array on error (e.g., getAll, search, filter)
 * 
 * BEHAVIOR:
 * - Calls handleError (logs to console + shows toast)
 * - Returns empty array for safe fallback in hook state
 * - Allows components to render empty states without crashing
 * 
 * @param error - Error that occurred in hook
 * @param options - Error handling configuration
 * @returns Empty array for safe hook return value
 * 
 * @example
 * // In a data hook returning a collection
 * export function useSparks() {
 *   const [sparks, setSparks] = useState<Spark[]>([]);
 *   const [isLoading, setIsLoading] = useState(true);
 *   
 *   const loadSparks = useCallback(async () => {
 *     setIsLoading(true);
 *     try {
 *       const data = await sparksService.getAll();
 *       setSparks(data);
 *     } catch (error) {
 *       setSparks(handleHookCollectionError<Spark>(error, { context: 'useSparks.loadSparks' }));
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   }, []);
 *   
 *   useEffect(() => { loadSparks(); }, [loadSparks]);
 *   
 *   return { sparks, isLoading, refetch: loadSparks };
 * }
 * 
 * @example
 * // With custom error message for user
 * catch (error) {
 *   setSparks(handleHookCollectionError<Spark>(error, {
 *     context: 'useSparks',
 *     fallbackMessage: 'Failed to load your sparks. Please try again.'
 *   }));
 * }
 * 
 * @see handleHookError for hooks returning single items
 * @see handleServiceError for service layer (no toast notifications)
 */
export function handleHookCollectionError<T>(error: unknown, options: ErrorHandlingOptions = {}): T[] {
  handleError(error, options);
  return [] as T[];
}

/**
 * Wrapper for async operations that return single items, with automatic error handling.
 * Simplifies try/catch blocks in components and hooks.
 * 
 * USE IN: Components and hooks for single async operations
 * USE WHEN: You want automatic error handling without writing try/catch
 * 
 * BEHAVIOR:
 * - Executes async function
 * - On success: returns result
 * - On error: handles error (toast + log) and returns null
 * 
 * @param fn - Async function to execute
 * @param options - Error handling configuration
 * @returns Promise resolving to function result or null on error
 * 
 * @example
 * // Instead of try/catch
 * async function handleCreate() {
 *   const newSpark = await tryCatch(
 *     () => sparksService.create(formData),
 *     { context: 'CreateSparkForm.handleCreate' }
 *   );
 *   
 *   if (newSpark) {
 *     navigate(`/sparks/${newSpark.id}`);
 *   }
 * }
 * 
 * @example
 * // In a component effect
 * useEffect(() => {
 *   tryCatch(
 *     () => settingsService.loadUserPreferences(),
 *     { context: 'SettingsPage' }
 *   ).then(prefs => {
 *     if (prefs) setPreferences(prefs);
 *   });
 * }, []);
 * 
 * @see tryCatchCollection for operations returning arrays
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
 * Wrapper for async operations that return collections, with automatic error handling.
 * Simplifies try/catch blocks for array-returning operations.
 * 
 * USE IN: Components and hooks for collection-returning async operations
 * USE WHEN: You want automatic error handling without writing try/catch
 * 
 * BEHAVIOR:
 * - Executes async function
 * - On success: returns array result
 * - On error: handles error (toast + log) and returns empty array
 * 
 * @param fn - Async function that returns an array
 * @param options - Error handling configuration
 * @returns Promise resolving to array result or empty array on error
 * 
 * @example
 * // Simplifies data loading in components
 * async function loadData() {
 *   setIsLoading(true);
 *   const sparks = await tryCatchCollection(
 *     () => sparksService.getAll(),
 *     { context: 'SparksPage.loadData' }
 *   );
 *   setSparks(sparks);
 *   setIsLoading(false);
 * }
 * 
 * @example
 * // In a search handler
 * async function handleSearch(query: string) {
 *   const results = await tryCatchCollection(
 *     () => sparksService.search(query),
 *     {
 *       context: 'SearchBar.handleSearch',
 *       fallbackMessage: 'Search failed. Please try again.'
 *     }
 *   );
 *   setSearchResults(results);
 * }
 * 
 * @example
 * // Disable toast for background operations
 * useEffect(() => {
 *   const loadCategories = async () => {
 *     const cats = await tryCatchCollection(
 *       () => categoriesService.getAll(),
 *       { showToast: false, context: 'CategoriesCache' }
 *     );
 *     setCachedCategories(cats);
 *   };
 *   loadCategories();
 * }, []);
 * 
 * @see tryCatch for operations returning single items
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