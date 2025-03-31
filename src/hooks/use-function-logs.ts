"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from "react-toastify";
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRealtimeSubscription } from './use-realtime-subscription';

// Define the FunctionLog type
export interface FunctionLog {
  id: string;
  function_name: string;
  function_id: string;
  run_id: string;
  status: 'started' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  input_params: any;
  result_data: any;
  error_message: string | null;
  error_stack: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Define filters for the logs
export interface FunctionLogsFilter {
  function_name?: string;
  status?: 'started' | 'completed' | 'failed';
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Hook to fetch and subscribe to function logs with real-time updates
 */
export function useFunctionLogs(initialFilters: FunctionLogsFilter = {}, token?: string | null) {
  const [logs, setLogs] = useState<FunctionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);
  
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
  const fetchLogs = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.limit) {
        queryParams.append("limit", filters.limit.toString());
      }
      
      if (filters.offset) {
        queryParams.append("offset", filters.offset.toString());
      }
      
      if (filters.order_by) {
        queryParams.append("order_by", filters.order_by);
      }
      
      if (filters.order_direction) {
        queryParams.append("order_direction", filters.order_direction);
      }
      
      if (filters.status) {
        queryParams.append("status", filters.status);
      }
      
      if (filters.function_name) {
        queryParams.append("function_name", filters.function_name.trim());
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
      setLogs(data.logs || []);
      setTotalLogs(data.pagination?.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch function logs";
      setError(errorMessage);
      console.error("Error fetching logs:", err);
      
      // Only show toast for errors that aren't auth related
      if (!errorMessage.includes("Unauthorized")) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, filters]);
  
  // Fetch logs ONCE when filters or token changes
  // Not on every render
  useEffect(() => {
    if (token) {
      console.log("Initial fetch of function logs");
      fetchLogs();
    }
  }, [token, fetchLogs]);
  
  // Handle realtime updates with a stable callback
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Realtime update received:', payload);
    
    // Instead of refetching, update the data in-memory based on the payload
    const eventType = payload.eventType;
    
    if (eventType === 'INSERT') {
      // For new logs, add them to the state if they match current filters
      const newLog = payload.new as FunctionLog;
      
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
            const aVal = a[sortBy as keyof FunctionLog] as any;
            const bVal = b[sortBy as keyof FunctionLog] as any;
            return isDESC ? (aVal > bVal ? -1 : 1) : (aVal > bVal ? 1 : -1);
          }).slice(0, filters.limit || 10); // Keep the same page size
        });
        
        // Update total count
        setTotalLogs(prev => prev + 1);
      }
    } else if (eventType === 'UPDATE') {
      // For updated logs, update them in-place
      const updatedLog = payload.new as FunctionLog;
      
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
      const deletedLog = payload.old as FunctionLog;
      
      setLogs(prev => 
        prev.filter(log => log.id !== deletedLog.id)
      );
      
      // Update total count
      setTotalLogs(prev => Math.max(0, prev - 1));
    }
  }, [filters, logs]);
  
  // Subscribe to realtime updates - properly scoped
  const { isConnected } = useRealtimeSubscription<FunctionLog>(
    { table: 'function_logs' },
    handleRealtimeUpdate
  );
  
  return {
    logs,
    isLoading,
    error,
    totalLogs,
    fetchLogs,
    realtimeConnected: isConnected
  };
} 