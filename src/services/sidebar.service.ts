import { SidebarItem } from '@/lib/types';

// Sort types
export type SortField = 'name' | 'highlightsCount' | 'date';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

/**
 * Service for handling sidebar-related operations, including sorting, filtering,
 * and persistence of user preferences
 */
export const sidebarService = {
  /**
   * Get saved search term from localStorage
   */
  getSavedSearch(title: string): string {
    if (typeof window === 'undefined') return '';
    
    try {
      const savedSearch = localStorage.getItem(`${title.toLowerCase()}-search`);
      if (savedSearch) {
        return savedSearch;
      }
    } catch (error) {
      console.error('Error loading search settings from localStorage:', error);
    }
    return '';
  },
  
  /**
   * Save search term to localStorage
   */
  saveSearch(title: string, searchTerm: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${title.toLowerCase()}-search`, searchTerm);
    } catch (error) {
      console.error('Error saving search to localStorage:', error);
    }
  },
  
  /**
   * Get saved sort preferences from localStorage
   */
  getSavedSort(title: string): SortState {
    if (typeof window === 'undefined') {
      return { field: 'name', direction: 'asc' };
    }
    
    try {
      const savedSort = localStorage.getItem(`${title.toLowerCase()}-sort`);
      if (savedSort) {
        return JSON.parse(savedSort);
      }
    } catch (error) {
      console.error('Error loading sort settings from localStorage:', error);
    }
    // Default sort by name ascending
    return { field: 'name', direction: 'asc' };
  },
  
  /**
   * Save sort preferences to localStorage
   */
  saveSort(title: string, sort: SortState): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${title.toLowerCase()}-sort`, JSON.stringify(sort));
    } catch (error) {
      console.error('Error saving sort settings to localStorage:', error);
    }
  },
  
  /**
   * Toggle sort direction or set a new sort field
   */
  toggleSort(currentSort: SortState, field: SortField): SortState {
    return {
      field,
      direction: currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc'
    };
  },
  
  /**
   * Filter items by search term
   */
  filterItems(items: SidebarItem[], searchTerm: string): SidebarItem[] {
    if (!searchTerm.trim()) return items;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerSearchTerm)
    );
  },
  
  /**
   * Sort items based on sort state
   */
  sortItems(items: SidebarItem[], sort: SortState): SidebarItem[] {
    return [...items].sort((a, b) => {
      if (sort.field === 'name') {
        return sort.direction === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sort.field === 'highlightsCount') {
        const countA = a.highlightsCount || 0;
        const countB = b.highlightsCount || 0;
        return sort.direction === 'asc' ? countA - countB : countB - countA;
      } else if (sort.field === 'date') {
        // Parse dates for sorting
        const dateA = this.parseDate(a.date);
        const dateB = this.parseDate(b.date);
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return sort.direction === 'asc' ? -1 : 1;
        if (!dateB) return sort.direction === 'asc' ? 1 : -1;
        
        // Compare the actual Date objects
        return sort.direction === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  },
  
  /**
   * Helper function to parse date strings in various formats
   */
  parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    
    try {
      // Try to parse the date with various formats
      // For "Aug '23" format, convert to a date object (August 2023)
      if (dateStr.includes("'")) {
        const parts = dateStr.split(" '");
        const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(parts[0]);
        const year = 2000 + parseInt(parts[1], 10);
        if (month >= 0 && !isNaN(year)) {
          return new Date(year, month, 1);
        }
      }
      
      // For "MM/YY" format
      if (dateStr.includes("/")) {
        const [month, year] = dateStr.split("/").map(Number);
        const fullYear = 2000 + year; // Assuming 20xx for all years
        return new Date(fullYear, month - 1, 1);
      }
      
      // Fallback to trying to parse the string directly
      return new Date(dateStr);
    } catch (e) {
      console.error("Error parsing date:", dateStr, e);
      return null;
    }
  }
}; 