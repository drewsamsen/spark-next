"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error Alert Component
export interface ErrorAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  variant?: "warning" | "error" | "info";
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorAlert({
  title,
  message,
  variant = "error",
  onRetry,
  onDismiss,
  className,
  ...props
}: ErrorAlertProps) {
  const variantStyles = {
    warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-200",
  };

  const IconComponent = variant === "warning" ? AlertTriangle : XCircle;
  const iconColorClass = variant === "warning" ? "text-amber-500 dark:text-amber-400" : "text-red-500 dark:text-red-400";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-4",
        variantStyles[variant],
        className
      )}
      role="alert"
      {...props}
    >
      <IconComponent className={cn("h-5 w-5 shrink-0", iconColorClass)} />
      <div className="flex-1">
        {title && <p className="mb-1 font-medium">{title}</p>}
        <p className="text-sm">{message}</p>
        {(onRetry || onDismiss) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs font-medium hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// FullPage Error Component
export interface FullPageErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function FullPageError({
  title = "Something went wrong",
  message = "We're having trouble loading this page. Please try again later.",
  actionLabel = "Try again",
  actionHref,
  onAction,
  className,
  ...props
}: FullPageErrorProps) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center",
        className
      )}
      {...props}
    >
      <XCircle className="mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
      <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {title}
      </h2>
      <p className="mb-8 max-w-md text-neutral-600 dark:text-neutral-400">
        {message}
      </p>
      {(actionHref || onAction) && (
        <Button
          variant="primary"
          onClick={onAction}
          {...(actionHref ? { as: "a", href: actionHref } : {})}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Error Boundary Component (used for Next.js error.tsx)
export interface ErrorBoundaryProps extends React.HTMLAttributes<HTMLDivElement> {
  error: Error;
  reset: () => void;
}

export function ErrorBoundary({
  error,
  reset,
  className,
  ...props
}: ErrorBoundaryProps) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error boundary caught error:", error);
  }, [error]);

  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center",
        className
      )}
      {...props}
    >
      <AlertTriangle className="mb-4 h-12 w-12 text-amber-500 dark:text-amber-400" />
      <h2 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        Something went wrong
      </h2>
      <p className="mb-2 max-w-md text-neutral-600 dark:text-neutral-400">
        An unexpected error occurred. Our team has been notified.
      </p>
      <p className="mb-8 max-w-md text-sm text-neutral-500 dark:text-neutral-500">
        Error: {error.message || "Unknown error"}
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
} 