"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  limit?: number;
  offset?: number;
  totalItems?: number;
  itemsOnPage?: number;
  maxVisiblePages?: number;
  className?: string;
}

/**
 * Reusable pagination component for use with tables
 */
export function Pagination({
  currentPage,
  pageCount,
  onPageChange,
  limit = 10,
  offset = 0,
  totalItems = 0,
  itemsOnPage = 0,
  maxVisiblePages = 5,
  className = ""
}: PaginationProps) {
  // If we have no pages, don't render pagination
  if (pageCount <= 1) {
    return null;
  }
  
  // Calculate visible page buttons
  const visiblePages = (): number[] => {
    if (pageCount <= maxVisiblePages) {
      // If total pages less than max visible, show all pages
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    
    // Calculate range of visible pages
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    // Adjust if we're near the end
    if (endPage > pageCount) {
      endPage = pageCount;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };
  
  const pages = visiblePages();
  
  // Calculate item range (e.g., "Showing 1-10 of 100")
  const startItem = offset + 1;
  const endItem = Math.min(offset + limit, totalItems);
  
  return (
    <div className={cn("px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700", className)}>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        {/* Item count */}
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        
        {/* Page buttons */}
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Previous page button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium",
                currentPage === 1
                  ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Page numbers */}
            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                  currentPage === page
                    ? "z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 dark:border-primary-500 text-primary-600 dark:text-primary-200"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                {page}
              </button>
            ))}
            
            {/* Next page button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
              className={cn(
                "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium",
                currentPage === pageCount
                  ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
      
      {/* Mobile pagination */}
      <div className="flex sm:hidden items-center justify-between w-full">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{pageCount}</span>
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "relative inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium",
              currentPage === 1
                ? "text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300 dark:border-gray-600"
                : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            Previous
          </button>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
            className={cn(
              "relative inline-flex items-center px-3 py-2 rounded-md border text-sm font-medium",
              currentPage === pageCount
                ? "text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-300 dark:border-gray-600"
                : "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
} 