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
        .select('id, rw_title, rw_num_highlights, rw_last_highlight_at')
        .eq('user_id', session.user.id)
        .order('rw_title', { ascending: true });
      
      if (error) {
        console.error('Error fetching books:', error);
        return [];
      }
      
      // Convert database rows to SidebarItem format
      return data.map(book => ({
        id: book.id,
        name: book.rw_title || 'Untitled Book',
        date: formatDate(book.rw_last_highlight_at),
        highlightsCount: book.rw_num_highlights || 0
      }));
    } catch (error) {
      console.error('Error in getBooks:', error);
      return [];
    }
  }
}; 