'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStorageItem, setStorageItem, createStorageKey } from '@/lib/client-storage';

type StorageValidator<T> = (value: T) => boolean;

/**
 * Hook for using localStorage with React state
 * @param feature The feature or component name
 * @param key The specific setting name
 * @param defaultValue The default value if not found
 * @param validator Optional function to validate the stored value
 * @returns [value, setValue, resetValue] tuple similar to useState
 */
export function useLocalStorage<T>(
  feature: string,
  key: string,
  defaultValue: T,
  validator?: StorageValidator<T>
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Create a namespaced key
  const storageKey = createStorageKey(feature, key);
  
  // Get the initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => 
    getStorageItem<T>(storageKey, defaultValue, validator)
  );

  // Handle updating state and localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prevValue => {
      // Handle functional updates
      const newValue = value instanceof Function ? value(prevValue) : value;
      
      // Save to localStorage
      setStorageItem(storageKey, newValue);
      
      return newValue;
    });
  }, [storageKey]);

  // Reset to default value
  const resetValue = useCallback(() => {
    setStoredValue(defaultValue);
    setStorageItem(storageKey, defaultValue);
  }, [defaultValue, storageKey]);

  // Sync with other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue) as T;
          if (!validator || validator(newValue)) {
            setStoredValue(newValue);
          }
        } catch (error) {
          console.error(`Error parsing storage value for ${storageKey}:`, error);
        }
      }
    };

    // Add event listener for storage events (for cross-tab sync)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey, validator]);

  return [storedValue, setValue, resetValue];
} 