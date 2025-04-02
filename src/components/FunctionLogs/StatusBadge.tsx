"use client";

import { CheckCircle, XCircle, Clock } from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

/**
 * Status badge component for function logs
 */
export function StatusBadge({ status }: StatusBadgeProps) {
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
} 