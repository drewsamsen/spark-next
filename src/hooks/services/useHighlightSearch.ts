import { useState, useEffect, useCallback, useRef } from 'react';
import { HighlightSearchMode, HighlightSearchResult } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase';

/**
 * Hook for searching highlights
 * 
 * @param initialQuery - Initial search query (default: '')
 * @param initialMode - Initial search mode (default: 'keyword')
 * @param limit - Maximum number of results to return (default: 10)
 * @param autoSearch - Whether to automatically search when query/mode changes (default: true)
 * @returns Search results, loading state, error, and search function
 */
export function useHighlightSearch(
  initialQuery: string = '',
  initialMode: HighlightSearchMode = 'keyword',
  limit: number = 10,
  autoSearch: boolean = true
) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState<HighlightSearchMode>(initialMode);
  const [results, setResults] = useState<HighlightSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track the latest request to avoid race conditions
  const latestRequestId = useRef(0);

  /**
   * Perform the search API call
   */
  const performSearch = useCallback(async (searchQuery: string, searchMode: HighlightSearchMode) => {
    // Clear any previous errors
    setError(null);

    // Don't search if query is empty
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Increment request ID to track this request
    const requestId = ++latestRequestId.current;
    
    setIsLoading(true);

    try {
      // Get the current auth session for the token
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/highlights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          mode: searchMode,
          limit,
        }),
      });

      // Only process if this is still the latest request
      if (requestId !== latestRequestId.current) {
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search highlights');
      }

      const data = await response.json();
      
      setResults(data.results || []);
      setError(null);
    } catch (err) {
      // Only set error if this is still the latest request
      if (requestId === latestRequestId.current) {
        console.error('Error searching highlights:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while searching');
        setResults([]);
      }
    } finally {
      // Only update loading state if this is still the latest request
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  /**
   * Auto search effect (only if enabled)
   */
  useEffect(() => {
    if (!autoSearch) {
      return;
    }

    // Don't search if query is empty
    if (!query || query.trim().length === 0) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    performSearch(query, mode);
  }, [query, mode, performSearch, autoSearch]);

  /**
   * Manual search function
   */
  const search = useCallback((searchQuery: string, searchMode?: HighlightSearchMode) => {
    setQuery(searchQuery);
    if (searchMode) {
      setMode(searchMode);
    }
    
    performSearch(searchQuery, searchMode || mode);
  }, [mode, performSearch]);

  /**
   * Clear search results
   */
  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    query,
    setQuery,
    mode,
    setMode,
    results,
    isLoading,
    error,
    search,
    clear,
  };
}

