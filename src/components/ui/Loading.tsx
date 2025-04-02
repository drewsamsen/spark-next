"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Spinner Component
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent" | "white";
}

export function Spinner({ size = "md", color = "primary", className, ...props }: SpinnerProps) {
  const sizeStyles = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const colorStyles = {
    primary: "border-spark-primary border-t-transparent dark:border-spark-dark-primary dark:border-t-transparent",
    secondary: "border-neutral-500 border-t-transparent dark:border-neutral-400 dark:border-t-transparent",
    accent: "border-spark-brand border-t-transparent dark:border-spark-dark-brand dark:border-t-transparent",
    white: "border-white border-t-transparent",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeStyles[size],
        colorStyles[color],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Loading Placeholder Component (centered spinner with optional text)
export interface LoadingPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  spinnerSize?: SpinnerProps["size"];
  spinnerColor?: SpinnerProps["color"];
}

export function LoadingPlaceholder({ 
  text, 
  spinnerSize, 
  spinnerColor, 
  className,
  ...props 
}: LoadingPlaceholderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6",
        className
      )}
      {...props}
    >
      <Spinner size={spinnerSize} color={spinnerColor} />
      {text && <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>}
    </div>
  );
}

// Skeleton Component
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  variant = "rectangular", 
  width, 
  height, 
  className, 
  ...props 
}: SkeletonProps) {
  const styles = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200 dark:bg-neutral-800",
        styles[variant],
        className
      )}
      style={{ 
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
      {...props}
    />
  );
}

// Card Skeleton
export function CardSkeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 p-4 dark:border-neutral-800",
        className
      )}
      {...props}
    >
      <div className="space-y-3">
        <Skeleton variant="text" className="h-5 w-2/3" />
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-4/5" />
      </div>
    </div>
  );
}

// Table Skeleton
export interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className, 
  ...props 
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        "w-full space-y-4",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex gap-4 border-b border-neutral-200 pb-2 dark:border-neutral-800">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="text" className="h-8 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" className="h-6 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
} 