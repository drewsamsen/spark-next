"use client";

import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Database } from './types';
import { SidebarItem } from './mock-api/types';

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

// Book details interface
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

/**
 * Service for fetching and managing books from the database
 */
export const booksService = {
  /**
   * Get all books for the current user
   */
  async getBooks(): Promise<SidebarItem[]> {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('User not authenticated');
        return [];
      }
      
      // Fetch books from the database for the current user
      const { data, error } = await supabase
        .from('books')
        .select('id, rw_id, rw_title, rw_num_highlights, rw_last_highlight_at')
        .eq('user_id', session.user.id)
        .order('rw_title', { ascending: true });
      
      if (error) {
        console.error('Error fetching books:', error);
        return [];
      }
      
      // Filter out any books that don't have a Readwise ID
      const booksWithRwId = data.filter(book => !!book.rw_id);
      
      // Convert database rows to SidebarItem format
      return booksWithRwId.map(book => ({
        id: book.id,
        rwId: book.rw_id,
        name: book.rw_title || 'Untitled Book',
        date: formatDate(book.rw_last_highlight_at),
        highlightsCount: book.rw_num_highlights || 0
      }));
    } catch (error) {
      console.error('Error in getBooks:', error);
      return [];
    }
  },

  /**
   * Get book details by ID
   */
  async getBookDetails(bookId: string): Promise<BookDetails | null> {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('User not authenticated');
        return null;
      }
      
      // Fetch book details from the database
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching book details:', error);
        return null;
      }
      
      if (!data) {
        console.error('Book not found');
        return null;
      }
      
      // Convert database row to BookDetails format
      return {
        id: data.id,
        title: data.rw_title || 'Untitled Book',
        author: data.rw_author || '',
        category: data.rw_category || '',
        source: data.rw_source || '',
        numHighlights: data.rw_num_highlights || 0,
        lastHighlightAt: data.rw_last_highlight_at,
        coverImageUrl: data.rw_cover_image_url,
        highlightsUrl: data.rw_highlights_url,
        sourceUrl: data.rw_source_url,
        documentNote: data.rw_document_note
      };
    } catch (error) {
      console.error('Error in getBookDetails:', error);
      return null;
    }
  },

  /**
   * Get highlights for a book
   */
  async getBookHighlights(bookId: string): Promise<Highlight[]> {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('User not authenticated');
        return [];
      }
      
      // Fetch highlights from the database
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', session.user.id)
        .order('rw_highlighted_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching book highlights:', error);
        return [];
      }

      // Create highlight objects with Readwise tags
      const highlights = data.map(highlight => ({
        id: highlight.id,
        text: highlight.rw_text || '',
        note: highlight.rw_note,
        location: highlight.rw_location,
        locationType: highlight.rw_location_type,
        highlightedAt: highlight.rw_highlighted_at,
        url: highlight.rw_url,
        color: highlight.rw_color,
        tags: highlight.rw_tags,
        sparkTags: [] as SparkTag[]
      }));

      // Fetch Spark tags for these highlights
      const highlightIds = highlights.map(h => h.id);
      
      try {
        // First get the highlight_tags relations
        const { data: highlightTagsData } = await supabase
          .from('highlight_tags')
          .select('highlight_id, tag_id')
          .in('highlight_id', highlightIds);
          
        if (highlightTagsData && highlightTagsData.length > 0) {
          // Get all tag IDs
          const tagIds = highlightTagsData.map(relation => relation.tag_id);
          
          // Fetch the actual tags
          const { data: tagsData } = await supabase
            .from('tags')
            .select('id, name')
            .in('id', tagIds);
            
          if (tagsData && tagsData.length > 0) {
            // Create a map of tag ID to tag object for fast lookups
            const tagsMap = new Map<string, SparkTag>();
            tagsData.forEach(tag => {
              tagsMap.set(tag.id, { id: tag.id, name: tag.name });
            });
            
            // Group relations by highlight_id
            const tagsByHighlight = highlightTagsData.reduce((acc, relation) => {
              if (!acc[relation.highlight_id]) {
                acc[relation.highlight_id] = [];
              }
              
              const tag = tagsMap.get(relation.tag_id);
              if (tag) {
                acc[relation.highlight_id].push(tag);
              }
              
              return acc;
            }, {} as Record<string, SparkTag[]>);
            
            // Add tags to highlights
            highlights.forEach(highlight => {
              highlight.sparkTags = tagsByHighlight[highlight.id] || [];
            });
          }
        }
      } catch (tagsError) {
        console.error('Error fetching highlight tags:', tagsError);
      }
      
      return highlights;
    } catch (error) {
      console.error('Error in getBookHighlights:', error);
      return [];
    }
  },

  /**
   * Get book details by Readwise ID (rw_id)
   */
  async getBookByReadwiseId(rwId: number): Promise<BookDetails | null> {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('User not authenticated');
        return null;
      }
      
      // Fetch book details from the database by rw_id
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('rw_id', rwId)
        .eq('user_id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching book details:', error);
        return null;
      }
      
      if (!data) {
        console.error('Book not found');
        return null;
      }
      
      // Convert database row to BookDetails format
      return {
        id: data.id,
        title: data.rw_title || 'Untitled Book',
        author: data.rw_author || '',
        category: data.rw_category || '',
        source: data.rw_source || '',
        numHighlights: data.rw_num_highlights || 0,
        lastHighlightAt: data.rw_last_highlight_at,
        coverImageUrl: data.rw_cover_image_url,
        highlightsUrl: data.rw_highlights_url,
        sourceUrl: data.rw_source_url,
        documentNote: data.rw_document_note
      };
    } catch (error) {
      console.error('Error in getBookByReadwiseId:', error);
      return null;
    }
  }
}; 