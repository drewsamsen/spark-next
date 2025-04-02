"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuthService } from './use-services';

/**
 * Type for the return value of a resource hook
 */
export interface UseResourceReturn<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  fetchData: () => Promise<T[]>;
  clearData: () => void;
}

/**
 * Type for a data manipulation function with optimistic updates
 */
export interface OptimisticUpdateConfig<T> {
  // Function to update local state immediately
  optimisticUpdate: (data: T[]) => T[];
  // Message to show on success
  successMessage?: string;
  // Message to show on failure
  errorMessage?: string;
}

/**
 * Base hook factory for creating data hooks following the repository-service-hook pattern
 * @param fetchDataFn - Function that fetches data from the service
 * @param deps - Dependencies for the useEffect and useCallback hooks
 */
export function createResourceHook<T>(
  fetchDataFn: () => Promise<T[]>,
  deps: any[] = []
): UseResourceReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const authService = useAuthService();
  
  // Load data on mount and when dependencies change
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Check authentication first
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
          if (isMounted) {
            setData([]);
            setIsLoading(false);
          }
          return;
        }
        
        // Fetch data
        const result = await fetchDataFn();
        
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load data'));
          setData([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange(() => {
      loadData();
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [authService, fetchDataFn, ...deps]);
  
  // Fetch data manually
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchDataFn();
      setData(result);
      setError(null);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(err instanceof Error ? err : new Error(errorMessage));
      console.error('Error fetching data:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [fetchDataFn]);
  
  // Clear data
  const clearData = useCallback(() => {
    setData([]);
    setError(null);
  }, []);
  
  return {
    data,
    isLoading,
    error,
    fetchData,
    clearData
  };
}

/**
 * Create a hook for data manipulation with optimistic updates
 * @param manipulateFn - The actual data manipulation function
 * @param config - Configuration for optimistic updates
 */
export function createDataManipulationHook<T, P>(
  manipulateFn: (params: P) => Promise<T | null>,
  getCurrentData: () => T[],
  setCurrentData: (data: T[]) => void,
  config: OptimisticUpdateConfig<T>
) {
  return async (params: P): Promise<T | null> => {
    // Store original data for rollback if needed
    const originalData = [...getCurrentData()];
    
    // Apply optimistic update
    setCurrentData(config.optimisticUpdate(originalData));
    
    try {
      // Perform actual operation
      const result = await manipulateFn(params);
      
      // Show success message if provided
      if (config.successMessage) {
        toast.success(config.successMessage);
      }
      
      return result;
    } catch (err) {
      // Rollback on failure
      setCurrentData(originalData);
      
      // Show error message
      const errorMessage = err instanceof Error 
        ? err.message 
        : config.errorMessage || 'Operation failed';
      
      toast.error(errorMessage);
      console.error('Error in data manipulation:', err);
      
      return null;
    }
  };
} 