"use client";

import { FormEvent, useState } from "react";
import { Search, RefreshCw, Filter } from "lucide-react";
import { FunctionLogsFilter } from "@/lib/types";

interface TableHeaderProps {
  onSearch: (filters: FunctionLogsFilter) => void;
  onRefresh: () => void;
  isLoading: boolean;
  realtimeConnected: boolean;
  currentFilters: FunctionLogsFilter;
}

/**
 * Table header component with search and filters
 */
export function TableHeader({
  onSearch,
  onRefresh,
  isLoading,
  realtimeConnected,
  currentFilters
}: TableHeaderProps) {
  const [searchTerm, setSearchTerm] = useState<string>(currentFilters.function_name || "");
  const [statusFilter, setStatusFilter] = useState<string>(currentFilters.status || "");

  // Handle form submit
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    onSearch({
      ...currentFilters,
      offset: 0, // Reset to first page
      function_name: searchTerm.trim() || undefined,
      status: statusFilter as 'started' | 'completed' | 'failed' | undefined
    });
  };

  // Handle status change
  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    
    onSearch({
      ...currentFilters,
      offset: 0, // Reset to first page
      status: status as 'started' | 'completed' | 'failed' | undefined
    });
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">History</h3>
        {realtimeConnected && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
            <span className="mr-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Live
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Search */}
        <form onSubmit={handleSubmit} className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search function name..."
          />
        </form>
        
        {/* Status filter */}
        <div className="relative w-40">
          <select 
            value={statusFilter} 
            onChange={(e) => handleStatusChange(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All statuses</option>
            <option value="started">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
        
        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
    </div>
  );
} 