import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/&/g, '-and-')     // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}

/**
 * Generate a random ID (useful for temporary IDs)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Format a date string for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Load a boolean value from localStorage with fallback
 * @param key - The localStorage key to retrieve
 * @param defaultValue - Default value to use if key not found
 * @returns The stored boolean value or defaultValue if not found
 */
export function loadBooleanFromStorage(key: string, defaultValue: boolean): boolean {
  try {
    if (typeof window === 'undefined') return defaultValue;
    
    const value = localStorage.getItem(key);
    if (value !== null) {
      return value === 'true';
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

/**
 * Load a string value from localStorage with fallback
 * @param key - The localStorage key to retrieve
 * @param defaultValue - Default value to use if key not found
 * @returns The stored string value or defaultValue if not found
 */
export function loadStringFromStorage(key: string, defaultValue: string | null): string | null {
  try {
    if (typeof window === 'undefined') return defaultValue;
    
    const value = localStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

/**
 * Save a value to localStorage
 * @param key - The localStorage key to set
 * @param value - The value to store
 * @returns True if saved successfully, false otherwise
 */
export function saveToStorage(key: string, value: string | boolean | number | object): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const valueToStore = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    
    localStorage.setItem(key, valueToStore);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

/**
 * Load an object from localStorage with fallback
 * @param key - The localStorage key to retrieve
 * @param defaultValue - Default value to use if key not found
 * @returns The stored object value or defaultValue if not found
 */
export function loadObjectFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
    
    const value = localStorage.getItem(key);
    if (value !== null) {
      return JSON.parse(value) as T;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

/**
 * Remove an item from localStorage
 * @param key - The localStorage key to remove
 * @returns True if removed successfully, false otherwise
 */
export function removeFromStorage(key: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
}
