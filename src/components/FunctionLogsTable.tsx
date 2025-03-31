"use client";

import { useState } from "react";
import { Search, RefreshCw, CheckCircle, XCircle, Clock, Filter, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useFunctionLogs, FunctionLog } from "@/hooks/use-function-logs";

interface FunctionLogsTableProps {
  className?: string;
}

export default function FunctionLogsTable({ className = "" }: FunctionLogsTableProps) {
  // Auth
  const { session, loading: authLoading, error: authError } = useSupabaseAuth();
  const token = session?.access_token;
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState("started_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Use the function logs hook with filters
  const {
    logs,
    isLoading,
    error,
    totalLogs,
    fetchLogs,
    autoRefreshEnabled,
    toggleAutoRefresh,
    realtimeConnected
  } = useFunctionLogs(
    {
      limit,
      offset,
      order_by: sortField,
      order_direction: sortDirection,
      status: statusFilter as 'started' | 'completed' | 'failed' | undefined,
      function_name: searchTerm.trim() || undefined
    },
    token
  );
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0); // Reset to first page
    fetchLogs();
  };
  
  // Handle sort
  const handleSort = (field: string) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Default to desc for new field
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case "started":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">
            {status}
          </span>
        );
    }
  };
  
  // Toggle row expansion
  const toggleRowExpansion = (logId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
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
  
  if (authError || !token) {
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
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Function Logs</h3>
          {realtimeConnected && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              <span className={`mr-1 h-2 w-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
              {autoRefreshEnabled ? 'Live' : 'Paused'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative w-full sm:w-auto">
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
          <div className="relative">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
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
          
          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={toggleAutoRefresh}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md ${
              autoRefreshEnabled 
                ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {autoRefreshEnabled ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </button>
          
          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
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
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="w-10 px-3 py-3"></th>
              <th 
                onClick={() => handleSort("function_name")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              >
                Function
                {sortField === "function_name" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th 
                onClick={() => handleSort("status")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              >
                Status
                {sortField === "status" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th 
                onClick={() => handleSort("started_at")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              >
                Started
                {sortField === "started_at" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th 
                onClick={() => handleSort("duration_ms")}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
              >
                Duration
                {sortField === "duration_ms" && (
                  <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {isLoading && !logs.length ? (
              // Loading skeleton rows
              Array(5).fill(0).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              // Empty state - updated colspan
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center">
                    <p className="mt-2 font-medium">No function logs found</p>
                    <p className="mt-1 text-xs">Try changing your search filters or run a background job</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Table rows with expandable content
              logs.map((log) => (
                <>
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.status === "completed" && log.result_data && (
                        <button 
                          onClick={() => toggleRowExpansion(log.id)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                        >
                          {expandedRows[log.id] 
                            ? <ChevronDown className="w-4 h-4" /> 
                            : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {log.function_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(log.started_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(2)}s` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.status === "failed" && log.error_message ? (
                        <span className="text-red-500">{log.error_message}</span>
                      ) : log.status === "completed" && log.result_data ? (
                        <span 
                          onClick={() => toggleRowExpansion(log.id)}
                          className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                        >
                          {JSON.stringify(log.result_data).substring(0, 30)}
                          {JSON.stringify(log.result_data).length > 30 ? "..." : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  
                  {/* Expandable row for result data */}
                  {expandedRows[log.id] && log.result_data && (
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="max-h-80 overflow-auto">
                          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-gray-100 dark:bg-gray-900 p-4 rounded-md">
                            {JSON.stringify(log.result_data, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pageCount > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={currentPage >= pageCount}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{logs.length ? offset + 1 : 0}</span> to{" "}
                <span className="font-medium">{offset + logs.length}</span> of{" "}
                <span className="font-medium">{totalLogs}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setOffset(0)}
                  disabled={offset === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <span className="sr-only">First</span>
                  ««
                </button>
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  «
                </button>
                
                {/* Page buttons */}
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  // For simplicity, show max 5 pages with current in middle when possible
                  let pageNum = 1;
                  if (pageCount <= 5) {
                    // If total pages <= 5, show all pages
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    // If near start, show first 5 pages
                    pageNum = i + 1;
                  } else if (currentPage >= pageCount - 2) {
                    // If near end, show last 5 pages
                    pageNum = pageCount - 4 + i;
                  } else {
                    // Otherwise current page in middle
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setOffset((pageNum - 1) * limit)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === pageNum
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                      } text-sm font-medium`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={currentPage >= pageCount}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  »
                </button>
                <button
                  onClick={() => setOffset((pageCount - 1) * limit)}
                  disabled={currentPage >= pageCount}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <span className="sr-only">Last</span>
                  »»
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 