"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from "react-toastify";
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRealtimeSubscription } from '../patterns/use-realtime-subscription';
import { FunctionLogModel, FunctionLogsFilter } from '@/lib/types';
import { handleError } from '@/lib/error-handling';
import { useAuthService } from '../services/use-services';

// Define the type alias for the legacy name for backwards compatibility
export type FunctionLog = FunctionLogModel;

/**
 * Hook to fetch and subscribe to function logs with real-time updates
 */
export function useFunctionLogs(initialFilters: FunctionLogsFilter = {}, enabled: boolean = true) {
  const [logs, setLogs] = useState<FunctionLogModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Use auth service to handle authentication
  const authService = useAuthService();
  
  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => initialFilters, [
    initialFilters.function_name,
    initialFilters.status,
    initialFilters.order_by,
    initialFilters.order_direction,
    initialFilters.limit,
    initialFilters.offset
  ]);
  
  // Function to fetch logs from the API - properly memoized
  const fetchLogs = useCallback(async (customFilters?: FunctionLogsFilter) => {
    if (!enabled) return;
    
    // Check authentication first
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      setLogs([]);
      setError("Authentication required");
      return;
    }
    
    // Get the session which contains the token
    const session = await authService.getSession();
    const token = session?.token;
    if (!token) {
      setError("Authentication token not available");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      const activeFilters = customFilters || filters;
      
      if (activeFilters.limit) {
        queryParams.append("limit", activeFilters.limit.toString());
      }
      
      if (activeFilters.offset) {
        queryParams.append("offset", activeFilters.offset.toString());
      }
      
      if (activeFilters.order_by) {
        queryParams.append("order_by", activeFilters.order_by);
      }
      
      if (activeFilters.order_direction) {
        queryParams.append("order_direction", activeFilters.order_direction);
      }
      
      if (activeFilters.status) {
        queryParams.append("status", activeFilters.status);
      }
      
      if (activeFilters.function_name) {
        queryParams.append("function_name", activeFilters.function_name.trim());
      }
      
      // Make the API request
      const response = await fetch(`/api/function-logs?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to fetch logs: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data); // Debug
      
      // Access the nested data structure from createSuccessResponse
      const responseData = data.data || data;
      setLogs(responseData.logs || []);
      setTotalLogs(responseData.pagination?.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch function logs";
      setError(errorMessage);
      
      // Use our standardized error handling
      handleError(err, {
        context: 'useFunctionLogs',
        showToast: !errorMessage.includes("Unauthorized"), // Only show non-auth errors as toast
        fallbackMessage: "Failed to fetch function logs"
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, enabled, authService]);
  
  // Fetch logs when filters change
  useEffect(() => {
    if (enabled) {
      fetchLogs();
    }
  }, [fetchLogs, enabled]);
  
  // Subscribe to auth state changes
  useEffect(() => {
    if (!enabled) return;
    
    const subscription = authService.onAuthStateChange(() => {
      console.log("Auth state changed, refreshing function logs");
      fetchLogs();
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [authService, fetchLogs, enabled]);
  
  // Handle realtime updates with a stable callback
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Realtime update received:', payload);
    
    // Instead of refetching, update the data in-memory based on the payload
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
                            (!filters.function_name || newLog.function_name.includes(filters.function_name));
      
      if (matchesFilters) {
        setLogs(prev => {
          // Keep the sort order by inserting at the right position
          // This assumes we're sorting by started_at in descending order by default
          const isDESC = filters.order_direction !== 'asc';
          const sortBy = filters.order_by || 'started_at';
          
          const newLogs = [...prev, newLog];
          return newLogs.sort((a, b) => {
            const aVal = a[sortBy as keyof FunctionLogModel] as any;
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
      
      // Update total count
      setTotalLogs(prev => Math.max(0, prev - 1));
    }
  }, [filters, logs]);
  
  // Subscribe to realtime updates - properly scoped
  const { isConnected } = useRealtimeSubscription<FunctionLogModel>(
    { table: 'function_logs' },
    handleRealtimeUpdate
  );
  
  // Helper functions
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  
  const formatDuration = (durationMs: number | null | undefined) => {
    if (durationMs === null || durationMs === undefined) return "—";
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${(durationMs / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = ((durationMs % 60000) / 1000).toFixed(2);
      return `${minutes}m ${seconds}s`;
    }
  };
  
  return {
    logs,
    isLoading,
    error,
    totalLogs,
    fetchLogs,
    realtimeConnected: isConnected,
    formatDate,
    formatDuration,
    filters
  };
} 