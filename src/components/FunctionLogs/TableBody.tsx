"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FunctionLogModel } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import React from "react";

interface TableBodyProps {
  logs: FunctionLogModel[];
  isLoading: boolean;
  sortField: string;
  sortDirection: "asc" | "desc";
  handleSort: (field: string) => void;
  formatDate: (date: string) => string;
  formatDuration: (ms: number | null | undefined) => string;
}

/**
 * Table body component for function logs
 */
export function TableBody({
  logs,
  isLoading,
  sortField,
  sortDirection,
  handleSort,
  formatDate,
  formatDuration
}: TableBodyProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Debug logs data
  console.log('TableBody - logs:', { logs, count: logs?.length || 0, isArray: Array.isArray(logs) });

  // Toggle row expansion
  const toggleRowExpansion = (logId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  return (
    <>
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
          {isLoading && (!logs || !logs.length) ? (
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
          ) : (!logs || !logs.length || logs.length === 0) ? (
            // Empty state
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
            logs.map((log: FunctionLogModel, index: number) => {
              console.log(`Log ${index}:`, log);
              return (
                <React.Fragment key={log.id || `log-${index}`}>
                  <tr 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${log.status === "completed" && log.result_data ? "cursor-pointer" : ""}`}
                    onClick={() => {
                      if (log.status === "completed" && log.result_data) {
                        toggleRowExpansion(log.id);
                      }
                    }}
                  >
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.status === "completed" && log.result_data && (
                        <div className="text-gray-500 dark:text-gray-400">
                          {expandedRows[log.id] 
                            ? <ChevronDown className="w-4 h-4" /> 
                            : <ChevronRight className="w-4 h-4" />}
                        </div>
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
                      {formatDuration(log.duration_ms)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.status === "failed" && log.error_message ? (
                        <span className="text-red-500">{log.error_message}</span>
                      ) : log.status === "completed" && log.result_data ? (
                        <span className="text-gray-500 dark:text-gray-400">
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
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </>
  );
} 