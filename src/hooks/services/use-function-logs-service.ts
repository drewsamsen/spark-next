"use client";

import { useState, useEffect, useCallback } from 'react';
import { functionLogsService } from '@/services/function-logs.service';
import { FunctionLogModel, FunctionLogsFilter } from '@/lib/types';
import { useRealtimeSubscription } from '../patterns/use-realtime-subscription';

/**
 * Hook to access the function logs service with realtime updates
 */
export function useFunctionLogsService(
  initialFilters: FunctionLogsFilter = {},
  enabled: boolean = true
) {
  const [logs, setLogs] = useState<FunctionLogModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState<FunctionLogsFilter>(initialFilters);
  
  // Function to fetch logs
  const fetchLogs = useCallback(async (customFilters?: FunctionLogsFilter) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filtersToUse = customFilters || filters;
      const result = await functionLogsService.getFunctionLogs(filtersToUse);
      
      setLogs(result.logs);
      setTotalLogs(result.count);
      
      // Update filters if custom filters were used
      if (customFilters) {
        setFilters(customFilters);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch function logs";
      setError(errorMessage);
      console.error("Error fetching logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  
  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchLogs();
    }
  }, [enabled, fetchLogs]);
  
  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Realtime update received:', payload);
    
    // Handle updates similar to the original hook but using our managed state
    const eventType = payload.eventType;
    
    if (eventType === 'INSERT') {
      // For new logs, add them to the state if they match current filters
      const newLog = payload.new as FunctionLogModel;
      
      // Only add if it matches our current filters
      const matchesFilters = (!filters.status || newLog.status === filters.status) &&
                            (!filters.function_name || newLog.function_name.includes(filters.function_name || ''));
      
      if (matchesFilters) {
        setLogs(prev => {
          // Keep the sort order by inserting at the right position
          const isDESC = filters.order_direction !== 'asc';
          const sortBy = filters.order_by || 'started_at';
          
          const newLogs = [...prev, newLog];
          return newLogs.sort((a, b) => {
            // @ts-ignore: Dynamic key access
            const aVal = a[sortBy as keyof FunctionLogModel] as any;
            // @ts-ignore: Dynamic key access
            const bVal = b[sortBy as keyof FunctionLogModel] as any;
            return isDESC ? (aVal > bVal ? -1 : 1) : (aVal > bVal ? 1 : -1);
          }).slice(0, filters.limit || 10); // Keep the same page size
        });
        
        // Update total count
        setTotalLogs(prev => prev + 1);
      }
    } else if (eventType === 'UPDATE') {
      // For updated logs, update them in-place
      const updatedLog = payload.new as FunctionLogModel;
      
      setLogs(prev => 
        prev.map(log => log.id === updatedLog.id ? updatedLog : log)
      );
    } else if (eventType === 'DELETE') {
      // For deleted logs, remove them from state
      const deletedLog = payload.old as FunctionLogModel;
      
      setLogs(prev => 
        prev.filter(log => log.id !== deletedLog.id)
      );
      
      // Update total count
      setTotalLogs(prev => Math.max(0, prev - 1));
    }
  }, [filters]);
  
  // Subscribe to realtime updates
  const { isConnected: realtimeConnected } = useRealtimeSubscription<FunctionLogModel>(
    { table: 'function_logs' },
    handleRealtimeUpdate
  );
  
  return {
    logs,
    isLoading,
    error,
    totalLogs,
    fetchLogs,
    realtimeConnected,
    filters,
    formatDate: functionLogsService.formatDate,
    formatDuration: functionLogsService.formatDuration
  };
} 