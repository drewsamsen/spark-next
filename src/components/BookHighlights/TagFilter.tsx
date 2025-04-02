'use client';

import { Button } from '@/components/ui/button';

interface TagFilterProps {
  tags: string[];
  tagCounts: Map<string, number>;
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

/**
 * Component for filtering highlights by tags
 */
export function TagFilter({ tags, tagCounts, selectedTag, onTagSelect }: TagFilterProps) {
  if (tags.length === 0) return null;
  
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">Filter by tag:</span>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Button
            key={tag}
            variant={selectedTag === tag ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1"
            onClick={() => onTagSelect(selectedTag === tag ? null : tag)}
          >
            <span>{tag}</span>
            <span className="text-xs">({tagCounts.get(tag) || 0})</span>
          </Button>
        ))}
      </div>
    </div>
  );
} 