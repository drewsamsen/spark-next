'use client';

import { useState, useCallback, useEffect } from 'react';
import { loadObjectFromStorage, saveToStorage } from '@/lib/utils';
import { SidebarType } from '@/lib/types';

interface SearchQueriesState {
  [key: string]: string; // Maps sidebar type to search query
}

interface SidebarSearchResult {
  searchQueries: SearchQueriesState;
  getSearchQuery: (sidebarType: SidebarType) => string;
  setSearchQuery: (sidebarType: SidebarType, query: string) => void;
  clearSearchQuery: (sidebarType: SidebarType) => void;
  clearAllSearchQueries: () => void;
  hasSearchQuery: (sidebarType: SidebarType) => boolean;
}

/**
 * Custom hook for managing sidebar search queries with localStorage persistence
 * 
 * @returns Object containing search queries state and management functions
 */
export function useSidebarSearch(): SidebarSearchResult {
  // Track if component has mounted to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  
  // Initialize with an empty object (will be populated from localStorage)
  const [searchQueries, setSearchQueries] = useState<SearchQueriesState>({});
  
  // Initialize state from localStorage on client-side only
  useEffect(() => {
    setHasMounted(true);
    
    if (typeof window !== 'undefined') {
      const savedQueries = loadObjectFromStorage<SearchQueriesState>('sidebarSearchQueries', {});
      setSearchQueries(savedQueries);
    }
  }, []);
  
  // Save to localStorage when search queries change
  useEffect(() => {
    if (hasMounted) {
      saveToStorage('sidebarSearchQueries', searchQueries);
    }
  }, [hasMounted, searchQueries]);
  
  // Get search query for a specific sidebar type
  const getSearchQuery = useCallback((sidebarType: SidebarType): string => {
    if (!sidebarType) return '';
    return searchQueries[sidebarType] || '';
  }, [searchQueries]);
  
  // Set search query for a specific sidebar type
  const setSearchQuery = useCallback((sidebarType: SidebarType, query: string) => {
    if (!sidebarType) return;
    
    setSearchQueries(prev => ({
      ...prev,
      [sidebarType]: query
    }));
  }, []);
  
  // Clear search query for a specific sidebar type
  const clearSearchQuery = useCallback((sidebarType: SidebarType) => {
    if (!sidebarType) return;
    
    setSearchQueries(prev => {
      const newState = { ...prev };
      delete newState[sidebarType];
      return newState;
    });
  }, []);
  
  // Clear all search queries
  const clearAllSearchQueries = useCallback(() => {
    setSearchQueries({});
  }, []);
  
  // Check if a sidebar type has a search query
  const hasSearchQuery = useCallback((sidebarType: SidebarType): boolean => {
    if (!sidebarType) return false;
    return sidebarType in searchQueries && !!searchQueries[sidebarType];
  }, [searchQueries]);
  
  return {
    searchQueries,
    getSearchQuery,
    setSearchQuery,
    clearSearchQuery,
    clearAllSearchQueries,
    hasSearchQuery
  };
} 