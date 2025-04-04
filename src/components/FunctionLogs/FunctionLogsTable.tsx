"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useFunctionLogs, useAuthSession } from "@/hooks";
import { FunctionLogsFilter } from "@/lib/types";
import { TableHeader, TableBody, Pagination } from ".";

interface FunctionLogsTableProps {
  className?: string;
}

export default function FunctionLogsTable({ className = "" }: FunctionLogsTableProps) {
  // Auth
  const { session, loading: authLoading, error: authError } = useAuthSession();
  
  // State
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState("started_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Initial filters
  const initialFilters: FunctionLogsFilter = {
    limit,
    offset,
    order_by: sortField,
    order_direction: sortDirection
  };
  
  // Use the function logs service hook with filters
  const {
    logs,
    isLoading,
    error,
    totalLogs,
    fetchLogs,
    realtimeConnected,
    formatDate,
    formatDuration,
    filters
  } = useFunctionLogs(initialFilters, !!session?.token);
  
  // Debug log data
  console.log('FunctionLogsTable - received logs:', { logs, totalLogs, isLoading, error });
  
  // Handle search and filter
  const handleSearch = (newFilters: FunctionLogsFilter) => {
    // Update state to match the new filters
    if (newFilters.offset !== undefined) {
      setOffset(newFilters.offset);
    }
    
    if (newFilters.order_by) {
      setSortField(newFilters.order_by);
    }
    
    if (newFilters.order_direction) {
      setSortDirection(newFilters.order_direction);
    }
    
    // Fetch logs with new filters
    fetchLogs(newFilters);
  };
  
  // Handle sort
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(newDirection);
      handleSearch({
        ...filters,
        order_by: field,
        order_direction: newDirection
      });
    } else {
      // Default to desc for new field
      setSortField(field);
      setSortDirection("desc");
      handleSearch({
        ...filters,
        order_by: field,
        order_direction: "desc"
      });
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * limit;
    setOffset(newOffset);
    handleSearch({
      ...filters,
      offset: newOffset
    });
  };
  
  // Auth loading or error state
  if (authLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (authError || !session?.token) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Authentication Required</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Please log in to view your function logs. If you're already logged in, try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
  
  // Number of pages for pagination
  const pageCount = Math.ceil(totalLogs / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  
  return (
    <div className={`bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden ${className}`}>
      {/* Table Header with filters */}
      <TableHeader
        onSearch={handleSearch}
        onRefresh={() => fetchLogs()}
        isLoading={isLoading}
        realtimeConnected={realtimeConnected}
        currentFilters={filters}
      />
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border-b border-red-100 dark:border-red-800">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <TableBody
          logs={logs}
          isLoading={isLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
          formatDate={formatDate}
          formatDuration={formatDuration}
        />
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        offset={offset}
        limit={limit}
        totalItems={totalLogs}
        itemsOnPage={logs.length}
      />
    </div>
  );
} 