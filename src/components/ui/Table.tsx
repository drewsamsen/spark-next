"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

/**
 * SortDirection type for consistent sorting
 */
export type SortDirection = "asc" | "desc";

/**
 * Column configuration for the Table component
 */
export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

/**
 * Table props for reusable table component
 */
export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortField?: string;
  sortDirection?: SortDirection;
  onSort?: (field: string) => void;
  isLoading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  error?: string | null;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: (item: T, index: number) => string;
}

/**
 * SortHeader component for showing sort direction
 */
function SortHeader({ 
  children, 
  sortField, 
  currentSortField, 
  direction 
}: { 
  children: React.ReactNode, 
  sortField: string, 
  currentSortField?: string, 
  direction?: SortDirection 
}) {
  const isCurrentSort = sortField === currentSortField;
  
  return (
    <div className="flex items-center gap-1">
      <div>{children}</div>
      <div className="flex flex-col">
        {isCurrentSort && direction === "asc" && (
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        )}
        {isCurrentSort && direction === "desc" && (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        )}
        {!isCurrentSort && (
          <div className="h-3 w-3" />
        )}
      </div>
    </div>
  );
}

/**
 * LoadingSkeleton for table rows
 */
export function TableLoadingSkeleton({ columns, rows = 3 }: { columns: number, rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={`loading-row-${rowIndex}`} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={`loading-cell-${rowIndex}-${colIndex}`} className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Table component for displaying data in a consistent way
 */
export function Table<T>({
  data,
  columns,
  sortField,
  sortDirection = "asc",
  onSort,
  isLoading = false,
  loadingRows = 3,
  emptyState,
  error,
  className = "",
  tableClassName = "",
  headerClassName = "",
  bodyClassName = "",
  rowClassName = () => ""
}: TableProps<T>) {
  return (
    <div className={cn("bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden", className)}>
      {/* Error display */}
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
        <table className={cn("min-w-full divide-y divide-gray-200 dark:divide-gray-700", tableClassName)}>
          <thead className={cn("bg-gray-50 dark:bg-gray-900", headerClassName)}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                    column.sortable && onSort ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" : "",
                    column.headerClassName
                  )}
                  onClick={() => column.sortable && onSort ? onSort(column.key) : undefined}
                >
                  {column.sortable && onSort ? (
                    <SortHeader
                      sortField={column.key}
                      currentSortField={sortField}
                      direction={sortDirection}
                    >
                      {column.header}
                    </SortHeader>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn("bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700", bodyClassName)}>
            {isLoading ? (
              <TableLoadingSkeleton columns={columns.length} rows={loadingRows} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center">
                  {emptyState || (
                    <div className="text-gray-500 dark:text-gray-400">
                      No data found
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr 
                  key={`row-${index}`} 
                  className={cn(
                    "hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors", 
                    rowClassName(item, index)
                  )}
                >
                  {columns.map((column) => (
                    <td 
                      key={`cell-${index}-${column.key}`} 
                      className={cn("px-4 py-3 whitespace-nowrap", column.className)}
                    >
                      {column.cell(item, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 