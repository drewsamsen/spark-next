import { ReactNode } from 'react';
import { Tag } from '@/lib/books-service';
import { HighlightDomain } from '@/lib/types';

/**
 * Function to render tag content depending on its type
 */
export const renderTag = (tag: Tag): string => {
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

/**
 * Extract all unique tags from highlights (both Readwise and Spark tags)
 */
export const extractUniqueTags = (highlights: HighlightDomain[]): string[] => {
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
  return Array.from(allTags).sort();
};

/**
 * Count number of highlights for each tag
 */
export const getTagCounts = (highlights: HighlightDomain[]): Map<string, number> => {
  return highlights.reduce((acc: Map<string, number>, highlight) => {
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
};

/**
 * Function to parse location for sorting
 */
export const parseLocation = (location: string | null): number => {
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

/**
 * Filter highlights based on search term and selected tag
 */
export const filterHighlights = (
  highlights: HighlightDomain[],
  searchTerm: string,
  filterTag: string | null
): HighlightDomain[] => {
  return highlights
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
};

/**
 * Function to format date
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}; 