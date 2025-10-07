import { Skeleton } from "./skeleton";

/**
 * Skeleton loader for book highlights page layout
 */
export function BookHighlightsSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-start gap-6">
          <Skeleton className="h-40 w-32 rounded-md" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-36" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for notes list page
 */
export function NotesListSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
        </div>
        
        {/* Create Note Form Skeleton */}
        <div className="bg-muted/30 p-6 rounded-lg border">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Notes List Skeleton */}
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for single note detail page
 */
export function NoteDetailSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for category/tag pages
 */
export function CategoryTagSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-8 w-48" />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6 dark:bg-neutral-800">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-full max-w-xs" />
          <Skeleton className="h-5 w-full max-w-md" />
          <Skeleton className="h-5 w-full max-w-sm" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 dark:bg-neutral-800">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for automations page
 */
export function AutomationsSkeleton() {
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 max-w-screen-xl">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      {/* Filters Skeleton */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-10 w-full md:w-40" />
        <Skeleton className="h-10 w-full md:w-40" />
        <Skeleton className="h-10 w-full md:w-32" />
      </div>
      
      {/* Table Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-4">
          <Skeleton className="h-5 w-full" />
        </div>
        {Array(10).fill(0).map((_, i) => (
          <div key={i} className="border-t p-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

