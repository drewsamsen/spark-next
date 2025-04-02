'use client';

import { Tag } from '@/lib/books-service';
import { useState } from 'react';
import { Search, Tag as TagIcon, CalendarDays, BookOpen, Quote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHighlightsService } from '@/hooks';
import { HighlightDomain } from '@/lib/types';

interface BookHighlightsProps {
  highlights: HighlightDomain[];
}

export default function BookHighlights({ highlights }: BookHighlightsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  
  const highlightsService = useHighlightsService();
  
  // Function to render tag content depending on its type
  const renderTag = (tag: Tag) => {
    if (typeof tag === 'string') {
      return tag;
    } else if (tag && typeof tag === 'object') {
      // If tag is an object with a name property, use that
      if ('name' in tag && typeof tag.name === 'string') {
        return tag.name;
      }
      // Otherwise try to stringify it
      try {
        return JSON.stringify(tag);
      } catch {
        return 'Unknown tag';
      }
    }
    return String(tag);
  };
  
  // Extract all unique tags from highlights (both Readwise and Spark tags)
  const allTags = highlights.reduce((acc: Set<string>, highlight) => {
    // Add Readwise tags
    if (highlight.rwTags && highlight.rwTags.length > 0) {
      highlight.rwTags.forEach(tag => {
        acc.add(renderTag(tag));
      });
    }
    
    // Add Spark tags
    if (highlight.tags && highlight.tags.length > 0) {
      highlight.tags.forEach(tag => {
        acc.add(tag.name);
      });
    }
    
    return acc;
  }, new Set<string>());
  
  // Create an array of unique tag strings
  const uniqueTags = Array.from(allTags).sort();
  
  // Function to parse location for sorting
  const parseLocation = (location: string | null): number => {
    if (!location) return Infinity; // Items without location go at the end
    
    // Try to extract a number from the location string
    const matches = location.match(/\d+/g); // Get all numbers in the string
    if (matches && matches.length > 0) {
      // If there are multiple numbers, take the first one
      // This handles formats like "Page 12-15" or "Location 1234-1240"
      return parseInt(matches[0], 10);
    }
    
    // If we can't parse a number, sort by string
    return Infinity;
  };
  
  // Sort and filter highlights
  const filteredHighlights = highlights
    .slice() // Create a copy of the array to avoid mutating the original
    .sort((a, b) => parseLocation(a.location) - parseLocation(b.location))
    .filter(highlight => {
      const matchesSearch = !searchTerm || 
        highlight.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (highlight.note && highlight.note.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTag = !filterTag || 
        (highlight.rwTags && highlight.rwTags.some(tag => renderTag(tag) === filterTag)) ||
        (highlight.tags && highlight.tags.some(tag => tag.name === filterTag));
      
      return matchesSearch && matchesTag;
    });
  
  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Count number of highlights for each tag
  const tagCounts = highlights.reduce((acc: Map<string, number>, highlight) => {
    // Count Readwise tags
    if (highlight.rwTags && highlight.rwTags.length > 0) {
      highlight.rwTags.forEach(tag => {
        const tagName = renderTag(tag);
        acc.set(tagName, (acc.get(tagName) || 0) + 1);
      });
    }
    
    // Count Spark tags
    if (highlight.tags && highlight.tags.length > 0) {
      highlight.tags.forEach(tag => {
        const tagName = tag.name;
        acc.set(tagName, (acc.get(tagName) || 0) + 1);
      });
    }
    
    return acc;
  }, new Map<string, number>());

  // Function to highlight text matches
  const highlightMatches = (text: string) => {
    if (!searchTerm || !text) return <>{text}</>;
    
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    const parts = [];
    
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerSearch);
    
    while (index !== -1) {
      // Add the text before the match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      
      // Add the matched text with highlighting
      parts.push(
        <span key={`match-${index}`} className="bg-primary/30 text-primary-foreground px-0.5 rounded">
          {text.substring(index, index + searchTerm.length)}
        </span>
      );
      
      lastIndex = index + searchTerm.length;
      index = lowerText.indexOf(lowerSearch, lastIndex);
    }
    
    // Add the remaining text after the last match
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return <>{parts}</>;
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
        
        {/* Search field */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search highlights..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Tag filters - now placed below the search bar */}
          {uniqueTags.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Filter by tag:</span>
              <div className="flex flex-wrap gap-2">
                {uniqueTags.map(tag => (
                  <Button
                    key={tag}
                    variant={filterTag === tag ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                  >
                    <span>{tag}</span>
                    <span className="text-xs">({tagCounts.get(tag) || 0})</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
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
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Quote className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-lg font-medium">No highlights found</h3>
          <p className="text-muted-foreground mt-1">
            {highlights.length === 0 
              ? "This book doesn't have any highlights yet." 
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredHighlights.map((highlight) => (
            <div 
              key={highlight.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col space-y-4">
                {/* Highlight text with stylized quote marks and highlighted search matches */}
                <div className="relative font-serif">
                  <div className="absolute -top-4 -left-2 text-4xl text-gray-200 dark:text-gray-700">"</div>
                  <div className="relative z-10">
                    <p className="text-lg leading-relaxed pl-3 py-1">
                      {highlightMatches(highlight.text)}
                    </p>
                  </div>
                  <div className="absolute -bottom-6 -right-2 text-4xl text-gray-200 dark:text-gray-700">"</div>
                </div>
                
                {/* Note if present - with highlighted search matches */}
                {highlight.note && (
                  <div className="bg-muted/40 p-3 rounded-md mt-2 border-l-4 border-blue-400">
                    <p className="text-sm whitespace-pre-line">
                      {highlightMatches(highlight.note)}
                    </p>
                  </div>
                )}
                
                {/* Metadata section */}
                <div className="flex flex-wrap gap-3 pt-3 text-sm text-muted-foreground border-t">
                  {/* Location */}
                  {highlight.location && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>{highlight.location}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Location in book</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {/* Date highlighted */}
                  {highlight.highlightedAt && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>{formatDate(highlight.highlightedAt)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Date highlighted</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                
                {/* Readwise Tags */}
                {highlight.rwTags && highlight.rwTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="flex items-center gap-1">
                      <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Readwise tags:</span>
                    </div>
                    {highlight.rwTags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className={`text-xs cursor-pointer hover:bg-muted ${filterTag === renderTag(tag) ? 'bg-primary/10 border-primary' : ''}`}
                        onClick={() => setFilterTag(filterTag === renderTag(tag) ? null : renderTag(tag))}
                      >
                        {renderTag(tag)}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Spark Tags */}
                {highlight.tags && highlight.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="flex items-center gap-1">
                      <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Spark tags:</span>
                    </div>
                    {highlight.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                        className={`text-xs cursor-pointer hover:bg-muted bg-primary/5 ${filterTag === tag.name ? 'bg-primary/10 border-primary' : ''}`}
                        onClick={() => setFilterTag(filterTag === tag.name ? null : tag.name)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 