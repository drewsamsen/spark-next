'use client';

import { useState, useCallback, useMemo } from 'react';
import { Quote } from 'lucide-react';
import { HighlightDomain } from '@/lib/types';
import { highlightsService } from '@/services/highlights.service';
import {
  TagFilter,
  HighlightCard,
  EmptyState,
  renderTag,
  extractUniqueTags,
  getTagCounts,
  filterHighlights,
  formatDate
} from '.';

interface HighlightsListProps {
  highlights: HighlightDomain[];
}

export default function HighlightsList({ highlights }: HighlightsListProps) {
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Set<string>>(new Set());
  
  // Extract unique tags from highlights
  const uniqueTags = extractUniqueTags(highlights);
  
  // Get tag counts
  const tagCounts = getTagCounts(highlights);
  
  // Determine which highlights to display (only tag filtering now)
  const displayedHighlights = useMemo(() => {
    return filterHighlights(highlights, '', filterTag);
  }, [filterTag, highlights]);
  
  // Handle tag selection
  const handleTagSelect = (tag: string | null) => {
    setFilterTag(tag);
  };

  // Debounce helper to avoid too many database writes
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Save note to database with debounce
  const saveUserNote = useCallback(
    debounce(async (highlightId: string, note: string) => {
      try {
        setSavingNotes(prev => new Set(prev).add(highlightId));
        await highlightsService.updateUserNote(highlightId, note);
      } catch (error) {
        console.error('Error saving user note:', error);
      } finally {
        setSavingNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(highlightId);
          return newSet;
        });
      }
    }, 500),
    []
  );

  // Handle user note changes
  const handleUserNoteChange = (highlightId: string, note: string) => {
    setUserNotes(prev => ({
      ...prev,
      [highlightId]: note
    }));
    
    // Save note to database with debounce
    saveUserNote(highlightId, note);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Quote className="h-5 w-5" />
          Highlights
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({highlights.length})
          </span>
        </h2>
        
        {/* Filter section (tag filtering only) */}
        <div className="flex flex-col gap-4">
          {/* Tag filters */}
          <TagFilter 
            tags={uniqueTags} 
            tagCounts={tagCounts} 
            selectedTag={filterTag} 
            onTagSelect={handleTagSelect} 
          />
        </div>
      </div>
      
      {/* Display number of filtered highlights if filtering is active */}
      {filterTag && (
        <div className="text-sm text-muted-foreground">
          Showing {displayedHighlights.length} of {highlights.length} highlights
        </div>
      )}
      
      {/* Highlights list */}
      {displayedHighlights.length === 0 ? (
        <EmptyState totalHighlights={highlights.length} />
      ) : (
        <div className="grid gap-6">
          {displayedHighlights.map((highlight) => (
            <HighlightCard
              key={highlight.id}
              highlight={{
                ...highlight,
                userNote: userNotes[highlight.id] !== undefined 
                  ? userNotes[highlight.id] 
                  : highlight.userNote
              }}
              renderTag={renderTag}
              formatDate={formatDate}
              highlightMatches={(text: string) => <span>{text}</span>}
              filterTag={filterTag}
              onTagSelect={handleTagSelect}
              onUserNoteChange={handleUserNoteChange}
              isSavingNote={savingNotes.has(highlight.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 