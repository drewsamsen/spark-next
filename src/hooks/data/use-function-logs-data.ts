"use client";

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useFunctionLogsService } from '../services/use-services';
import { createResourceHook, OptimisticUpdateConfig } from '../patterns/use-base-resource';
import { FunctionLogModel, FunctionLogsFilter } from '@/lib/types';
import { useRealtimeSubscription } from '../patterns/use-realtime-subscription';

/**
 * Hook for fetching function logs with filtering and pagination
 */
export function useFunctionLogsData(initialFilters: FunctionLogsFilter = {}) {
  const [logs, setLogs] = useState<FunctionLogModel[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const functionLogsService = useFunctionLogsService();
  
  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => initialFilters, [
    initialFilters.function_name,
    initialFilters.status,
    initialFilters.order_by,
    initialFilters.order_direction,
    initialFilters.limit,
    initialFilters.offset
  ]);
  
  // Fetch data function for the resource hook
  const fetchLogs = useCallback(async () => {
    const { logs: fetchedLogs, count } = await functionLogsService.getFunctionLogs(filters);
    setLogs(fetchedLogs);
    setTotalLogs(count);
    return fetchedLogs;
  }, [functionLogsService, filters]);
  
  // Use the base resource hook for data fetching, loading state, and error handling
  const { isLoading, error, fetchData, clearData } = createResourceHook<FunctionLogModel>(
    fetchLogs,
    [filters]
  );
  
  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Realtime update received:', payload);
    
    const eventType = payload.eventType;
    
    if (eventType === 'INSERT') {
      // For new logs, add them to the state if they match current filters
      const newLog = payload.new as FunctionLogModel;
      
      // Only show toast for non-started logs to reduce noise
      if (newLog.status !== 'started') {
        toast.info(`New function execution: ${newLog.function_name}`);
      }
      
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
            const aVal = a[sortBy as keyof FunctionLogModel] as any;
            const bVal = b[sortBy as keyof FunctionLogModel] as any;
            return isDESC ? (aVal > bVal ? -1 : 1) : (aVal > bVal ? 1 : -1);
          }).slice(0, filters.limit || 10); // Keep the same page size
        });
        
        setTotalLogs(prev => prev + 1);
      }
    } else if (eventType === 'UPDATE') {
      // For updated logs, update them in-place
      const updatedLog = payload.new as FunctionLogModel;
      
      // Show toast for status changes, but prevent duplicate toasts
      if (payload.old && payload.old.status !== updatedLog.status) {
        // Look for this log in our current state to avoid duplicate notifications
        const existingLogIndex = logs.findIndex(log => log.id === updatedLog.id);
        const existingLog = existingLogIndex !== -1 ? logs[existingLogIndex] : null;
        
        // Only show completion toast if we don't already have this log with completed status
        if (updatedLog.status === 'completed' && (!existingLog || existingLog.status !== 'completed')) {
          toast.success(`Function ${updatedLog.function_name} completed successfully`);
        } else if (updatedLog.status === 'failed' && (!existingLog || existingLog.status !== 'failed')) {
          toast.error(`Function ${updatedLog.function_name} failed: ${updatedLog.error_message || 'Unknown error'}`);
        }
      }
      
      setLogs(prev => 
        prev.map(log => log.id === updatedLog.id ? updatedLog : log)
      );
    } else if (eventType === 'DELETE') {
      // For deleted logs, remove them from state
      const deletedLog = payload.old as FunctionLogModel;
      
      setLogs(prev => 
        prev.filter(log => log.id !== deletedLog.id)
      );
      
      setTotalLogs(prev => Math.max(0, prev - 1));
    }
  }, [filters, logs]);
  
  // Subscribe to realtime updates
  const { isConnected } = useRealtimeSubscription<FunctionLogModel>(
    { table: 'function_logs' },
    handleRealtimeUpdate
  );
  
  return {
    logs,
    isLoading,
    error,
    totalLogs,
    fetchLogs: fetchData,
    clearLogs: clearData,
    realtimeConnected: isConnected,
    formatDate: functionLogsService.formatDate,
    formatDuration: functionLogsService.formatDuration
  };
} 