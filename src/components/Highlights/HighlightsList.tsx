'use client';

import { useState, useCallback, useMemo } from 'react';
import { Quote, Loader2 } from 'lucide-react';
import { HighlightDomain, HighlightSearchMode } from '@/lib/types';
import { highlightsService } from '@/services/highlights.service';
import { useHighlightSearch } from '@/hooks/services/useHighlightSearch';
import {
  SearchBar,
  TagFilter,
  HighlightCard,
  EmptyState,
  HighlightTextWithMatches,
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
  
  // Use API-based search hook
  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    mode: searchMode,
    setMode: setSearchMode,
    results: searchResults,
    isLoading: isSearching,
    error: searchError
  } = useHighlightSearch('', 'keyword', 50);
  
  // Extract unique tags from highlights
  const uniqueTags = extractUniqueTags(highlights);
  
  // Get tag counts
  const tagCounts = getTagCounts(highlights);
  
  // Determine which highlights to display
  const displayedHighlights = useMemo(() => {
    // If there's a search query, use API search results
    if (searchTerm && searchTerm.trim().length > 0) {
      // Apply tag filter to search results if needed
      if (filterTag) {
        return searchResults.filter(h => 
          h.tags && h.tags.some(tag => tag.name === filterTag)
        );
      }
      return searchResults;
    }
    
    // Otherwise, use client-side filtering (backward compatibility)
    return filterHighlights(highlights, '', filterTag);
  }, [searchTerm, searchResults, filterTag, highlights]);
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle search mode changes
  const handleSearchModeChange = (mode: HighlightSearchMode) => {
    setSearchMode(mode);
  };
  
  // Handle tag selection
  const handleTagSelect = (tag: string | null) => {
    setFilterTag(tag);
  };
  
  // Create highlight text match renderer
  const highlightMatches = (text: string) => {
    return <HighlightTextWithMatches text={text} searchTerm={searchTerm} />;
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
        
        {/* Search and filter section */}
        <div className="flex flex-col gap-4">
          <SearchBar 
            searchTerm={searchTerm} 
            onSearchChange={handleSearchChange}
            searchMode={searchMode}
            onSearchModeChange={handleSearchModeChange}
          />
          
          {/* Tag filters */}
          <TagFilter 
            tags={uniqueTags} 
            tagCounts={tagCounts} 
            selectedTag={filterTag} 
            onTagSelect={handleTagSelect} 
          />
        </div>
      </div>
      
      {/* Display search error if any */}
      {searchError && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          Error: {searchError}
        </div>
      )}
      
      {/* Display loading state */}
      {isSearching && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Searching...
        </div>
      )}
      
      {/* Display number of filtered highlights if filtering is active */}
      {(searchTerm || filterTag) && !isSearching && (
        <div className="text-sm text-muted-foreground">
          Showing {displayedHighlights.length} of {highlights.length} highlights
        </div>
      )}
      
      {/* Highlights list */}
      {displayedHighlights.length === 0 && !isSearching ? (
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
              highlightMatches={highlightMatches}
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