'use client';

import { Quote } from 'lucide-react';

interface EmptyStateProps {
  totalHighlights: number;
}

/**
 * Empty state component for when no highlights are found
 */
export function EmptyState({ totalHighlights }: EmptyStateProps) {
  return (
    <div className="text-center py-12 border rounded-lg bg-muted/30">
      <Quote className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
      <h3 className="text-lg font-medium">No highlights found</h3>
      <p className="text-muted-foreground mt-1">
        {totalHighlights === 0 
          ? "This book doesn't have any highlights yet." 
          : "Try adjusting your search or filters."}
      </p>
    </div>
  );
} 