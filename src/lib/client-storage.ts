/**
 * A type-safe wrapper around localStorage with validation
 */

type StorageValidationFn<T> = (value: T) => boolean;

// Default validator accepts any value
const defaultValidator = <T>(_value: T) => true;

/**
 * Get a value from localStorage
 * @param key The localStorage key
 * @param defaultValue The default value if not found
 * @param validator Optional function to validate the stored value
 * @returns The stored value or default value
 */
export function getStorageItem<T>(
  key: string,
  defaultValue: T,
  validator: StorageValidationFn<T> = defaultValidator
): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    const parsedItem = JSON.parse(item) as T;
    
    if (validator(parsedItem)) {
      return parsedItem;
    } else {
      // If validation fails, remove the invalid item and return default
      localStorage.removeItem(key);
      return defaultValue;
    }
  } catch (error) {
    // Handle parsing errors by resetting to default value
    console.error(`Error getting localStorage item ${key}:`, error);
    localStorage.removeItem(key);
    return defaultValue;
  }
}

/**
 * Store a value in localStorage
 * @param key The localStorage key
 * @param value The value to store
 * @returns true if successful, false otherwise
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting localStorage item ${key}:`, error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 * @param key The localStorage key to remove
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage item ${key}:`, error);
  }
}

/**
 * Create a namespaced key to avoid collisions
 * @param feature The feature or component name
 * @param setting The specific setting name
 * @returns A namespaced localStorage key
 */
export function createStorageKey(feature: string, setting: string): string {
  return `app.${feature}.${setting}`;
} 