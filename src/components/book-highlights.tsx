'use client';

import { useState } from 'react';
import { Quote } from 'lucide-react';
import { HighlightDomain } from '@/lib/types';
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
} from './BookHighlights';

interface BookHighlightsProps {
  highlights: HighlightDomain[];
}

export default function BookHighlights({ highlights }: BookHighlightsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  
  // Extract unique tags from highlights
  const uniqueTags = extractUniqueTags(highlights);
  
  // Get tag counts
  const tagCounts = getTagCounts(highlights);
  
  // Filter and sort highlights
  const filteredHighlights = filterHighlights(highlights, searchTerm, filterTag);
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle tag selection
  const handleTagSelect = (tag: string | null) => {
    setFilterTag(tag);
  };
  
  // Create highlight text match renderer
  const highlightMatches = (text: string) => {
    return <HighlightTextWithMatches text={text} searchTerm={searchTerm} />;
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
      
      {/* Display number of filtered highlights if filtering is active */}
      {(searchTerm || filterTag) && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredHighlights.length} of {highlights.length} highlights
        </div>
      )}
      
      {/* Highlights list */}
      {filteredHighlights.length === 0 ? (
        <EmptyState totalHighlights={highlights.length} />
      ) : (
        <div className="grid gap-6">
          {filteredHighlights.map((highlight) => (
            <HighlightCard
              key={highlight.id}
              highlight={highlight}
              renderTag={renderTag}
              formatDate={formatDate}
              highlightMatches={highlightMatches}
              filterTag={filterTag}
              onTagSelect={handleTagSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
} 