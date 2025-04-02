'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSparksService } from './use-services';
import { useAuthService } from './use-services';
import { toast } from 'react-toastify';

// Define interfaces for our hook return values
interface UseSparksReturn {
  sparks: any[]; // We should define a proper type for sparks
  isLoading: boolean;
  error: Error | null;
  getSparks: () => Promise<any[]>;
  getSparkDetails: (sparkId: string) => Promise<any | null>;
  createSpark: (data: any) => Promise<any | null>;
  updateSpark: (sparkId: string, data: any) => Promise<any | null>;
  deleteSpark: (sparkId: string) => Promise<boolean>;
}

/**
 * React hook for managing sparks with loading states and error handling
 */
export function useSparks(): UseSparksReturn {
  const [sparks, setSparks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const sparksService = useSparksService();
  const authService = useAuthService();
  
  // Load sparks on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadSparks = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
          if (isMounted) {
            setSparks([]);
            setIsLoading(false);
          }
          return;
        }
        
        // Fetch sparks
        const data = await sparksService.getSparks();
        
        if (isMounted) {
          setSparks(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading sparks:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load sparks'));
          setSparks([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadSparks();
    
    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange(() => {
      loadSparks();
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [sparksService, authService]);
  
  // Function to get sparks
  const getSparks = useCallback(
    async (): Promise<any[]> => {
      try {
        setIsLoading(true);
        const data = await sparksService.getSparks();
        
        // Update local state
        setSparks(data);
        setError(null);
        
        return data;
      } catch (err) {
        console.error('Error fetching sparks:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch sparks'));
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [sparksService]
  );
  
  // Function to get a specific spark's details
  const getSparkDetails = useCallback(
    async (sparkId: string): Promise<any | null> => {
      try {
        return await sparksService.getSparkDetails(sparkId);
      } catch (err) {
        console.error(`Error fetching spark details for ${sparkId}:`, err);
        toast.error('Failed to load spark details');
        return null;
      }
    },
    [sparksService]
  );
  
  // Function to create a new spark
  const createSpark = useCallback(
    async (data: any): Promise<any | null> => {
      try {
        const newSpark = await sparksService.createSpark(data);
        
        // Update local state
        setSparks(prev => [newSpark, ...prev]);
        
        toast.success('Spark created successfully');
        return newSpark;
      } catch (err) {
        console.error('Error creating spark:', err);
        toast.error('Failed to create spark');
        return null;
      }
    },
    [sparksService]
  );
  
  // Function to update a spark
  const updateSpark = useCallback(
    async (sparkId: string, data: any): Promise<any | null> => {
      try {
        const updatedSpark = await sparksService.updateSpark(sparkId, data);
        
        // Update local state
        setSparks(prev => prev.map(spark => 
          spark.id === sparkId ? updatedSpark : spark
        ));
        
        toast.success('Spark updated successfully');
        return updatedSpark;
      } catch (err) {
        console.error(`Error updating spark ${sparkId}:`, err);
        toast.error('Failed to update spark');
        return null;
      }
    },
    [sparksService]
  );
  
  // Function to delete a spark
  const deleteSpark = useCallback(
    async (sparkId: string): Promise<boolean> => {
      try {
        await sparksService.deleteSpark(sparkId);
        
        // Update local state
        setSparks(prev => prev.filter(spark => spark.id !== sparkId));
        
        toast.success('Spark deleted successfully');
        return true;
      } catch (err) {
        console.error(`Error deleting spark ${sparkId}:`, err);
        toast.error('Failed to delete spark');
        return false;
      }
    },
    [sparksService]
  );
  
  return {
    sparks,
    isLoading,
    error,
    getSparks,
    getSparkDetails,
    createSpark,
    updateSpark,
    deleteSpark
  };
} 