"use client";

import { Calendar } from "lucide-react";
import { SparkDomain } from "@/lib/types";

interface SparkContentProps {
  sparkDetails: SparkDomain;
  formatDate: (dateString: string | null) => string;
}

/**
 * Component for displaying the main content of a spark
 */
export function SparkContent({ sparkDetails, formatDate }: SparkContentProps) {
  return (
    <>
      {/* Spark Body Text */}
      <div className="mb-4 pr-8">
        <p className="text-sm">{sparkDetails.body}</p>
      </div>
      
      {/* Date Info */}
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" />
        <span>
          {sparkDetails.todoCreatedAt 
            ? formatDate(sparkDetails.todoCreatedAt) 
            : formatDate(sparkDetails.createdAt)}
        </span>
      </div>
    </>
  );
} 