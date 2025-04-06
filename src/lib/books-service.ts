"use client";

import { SidebarItem } from './types';
import { BookDomain } from '@/repositories/books.repository';
import { HighlightDomain } from '@/repositories/highlights.repository';
import { booksService as serviceImpl } from '@/services/books.service';

/**
 * Formats a date in "MMM 'YY" format (e.g., "Aug '23")
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  // Get abbreviated month name (Jan, Feb, etc.)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().slice(2);
  
  return `${month} '${year}`;
}

// Re-export interfaces for backward compatibility
export interface BookDetails {
  id: string;
  title: string;
  author: string;
  category: string;
  source: string;
  numHighlights: number;
  lastHighlightAt: string | null;
  coverImageUrl: string | null;
  highlightsUrl: string | null;
  sourceUrl: string | null;
  documentNote: string | null;
}

// Tag interface for handling different tag formats
export type Tag = string | { id: string; name: string } | Record<string, any>;

// Spark tag interface
interface SparkTag {
  id: string;
  name: string;
}

// Highlight interface
export interface Highlight {
  id: string;
  text: string;
  note: string | null;
  location: string | null;
  locationType: string | null;
  highlightedAt: string | null;
  url: string | null;
  color: string | null;
  tags: Tag[] | null;
  sparkTags: SparkTag[] | null;
}

// Helper function to map BookDomain to BookDetails
function mapToLegacyDetails(book: BookDomain): BookDetails {
  return {
    id: book.id,
    title: book.title,
    author: book.author || '',
    category: book.category || '',
    source: book.source || '',
    numHighlights: book.numHighlights,
    lastHighlightAt: book.lastHighlightAt,
    coverImageUrl: book.coverImageUrl,
    highlightsUrl: book.highlightsUrl,
    sourceUrl: book.sourceUrl,
    documentNote: book.documentNote
  };
}

/**
 * Map a domain highlight to a legacy highlight object for backwards compatibility
 */
function mapToLegacyHighlight(highlight: HighlightDomain): Highlight {
  return {
    id: highlight.id,
    text: highlight.text,
    note: highlight.note,
    location: highlight.location,
    locationType: highlight.locationType,
    highlightedAt: highlight.highlightedAt,
    url: highlight.url,
    color: highlight.color,
    tags: highlight.tags.map(tag => tag.name),
    sparkTags: highlight.tags
  };
}

/**
 * Service for fetching and managing books from the database
 */
export const booksService = {
  /**
   * Get all books for the current user
   * @deprecated Use the booksService from '@/services/books.service' instead
   */
  async getBooks(): Promise<SidebarItem[]> {
    return await serviceImpl.getBooks();
  },

  /**
   * Get book details by ID
   * @deprecated Use the booksService from '@/services/books.service' instead
   */
  async getBookDetails(bookId: string): Promise<BookDetails | null> {
    const bookDomain = await serviceImpl.getBookDetails(bookId);
    
    if (!bookDomain) {
      return null;
    }
    
    return mapToLegacyDetails(bookDomain);
  },

  /**
   * Get highlights for a book
   * @deprecated Use the booksService from '@/services/books.service' instead
   */
  async getBookHighlights(bookId: string): Promise<Highlight[]> {
    const highlights = await serviceImpl.getBookHighlights(bookId);
    
    return highlights.map(mapToLegacyHighlight);
  },

  /**
   * Get book details by Readwise ID (rw_id)
   * @deprecated Use the booksService from '@/services/books.service' instead
   */
  async getBookByReadwiseId(rwId: number): Promise<BookDetails | null> {
    const bookDomain = await serviceImpl.getBookByReadwiseId(rwId);
    
    if (!bookDomain) {
      return null;
    }
    
    return mapToLegacyDetails(bookDomain);
  }
}; 