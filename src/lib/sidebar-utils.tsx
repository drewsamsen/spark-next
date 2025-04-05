import { SidebarItem, SidebarType, EnhancedSparkItem } from "@/lib/types";
import { Highlighter, Flame, FolderIcon, TagsIcon, StickyNote } from "lucide-react";
import React from "react";

/**
 * Get the display title for a sidebar type
 * @param type - The sidebar type
 * @returns The display title for the sidebar
 */
export function getSidebarTitle(type: SidebarType): string {
  switch (type) {
    case 'highlights': return 'Highlights';
    case 'sparks': return 'Sparks';
    case 'categories': return 'Categories';
    case 'tags': return 'Tags';
    case 'notes': return 'Notes';
    default: return '';
  }
}

/**
 * Get the icon component for a sidebar type
 * @param type - The sidebar type
 * @returns The icon React element for the sidebar
 */
export function getSidebarIcon(type: SidebarType): React.ReactNode {
  switch (type) {
    case 'highlights': return <Highlighter className="h-5 w-5" />;
    case 'sparks': return <Flame className="h-5 w-5" />;
    case 'categories': return <FolderIcon className="h-5 w-5" />;
    case 'tags': return <TagsIcon className="h-5 w-5" />;
    case 'notes': return <StickyNote className="h-5 w-5" />;
    default: return null;
  }
}

/**
 * Get the display name for a sidebar menu item
 * @param itemName - The name of the menu item
 * @returns The corresponding sidebar type
 */
export function getSidebarTypeFromItem(itemName: string): SidebarType {
  switch (itemName) {
    case 'Highlights': return 'highlights';
    case 'Sparks': return 'sparks';
    case 'Notes': return 'notes';
    case 'Categories': return 'categories';
    case 'Tags': return 'tags';
    default: return null;
  }
}

/**
 * Determine if a path should keep the sidebar open
 * @param sidebarType - The current sidebar type
 * @param path - The navigation path
 * @returns Whether the sidebar should remain open
 */
export function shouldKeepSidebarOpen(sidebarType: SidebarType, path: string): boolean {
  if (!sidebarType) return false;

  switch (sidebarType) {
    case 'highlights': return path.includes('/highlights/');
    case 'sparks': return path.includes('/spark/');
    case 'notes': return path.includes('/notes/');
    case 'categories': return path.includes('/category/');
    case 'tags': return path.includes('/tag/');
    default: return false;
  }
}

/**
 * Get the path to navigate to when selecting an item
 * @param type - The sidebar type
 * @param itemId - The ID of the selected item
 * @param items - The list of available items
 * @param categoryData - Optional data for categories
 * @param extraData - Additional data for the item (e.g., readwise ID)
 * @returns The path to navigate to
 */
export function getNavigationPath(
  type: SidebarType, 
  itemId: string, 
  items: SidebarItem[] | EnhancedSparkItem[],
  categoryData?: any[],
  extraData?: any
): string | null {
  switch (type) {
    case 'highlights': {
      // For books/highlights, rwId might be provided directly or in the item
      if (typeof extraData === 'number') {
        return `/highlights/${extraData}`;
      }
      
      // Try to find the Readwise ID in the selected book
      const selectedBook = items.find(book => book.id === itemId) as SidebarItem;
      if (selectedBook?.rwId) {
        return `/highlights/${selectedBook.rwId}`;
      }
      return null;
    }
    case 'sparks': {
      return `/spark/${itemId}`;
    }
    case 'categories': {
      // Find the category to get its slug
      if (categoryData && categoryData.length > 0) {
        const selectedCategory = categoryData.find(category => category.id === itemId);
        if (selectedCategory?.slug) {
          return `/category/${selectedCategory.slug}`;
        }
      }
      return null;
    }
    case 'tags': {
      // Find the tag to get its name
      const selectedTag = items.find(tag => tag.id === itemId) as SidebarItem;
      if (selectedTag?.name) {
        return `/tag/${selectedTag.name}`;
      }
      return `/tag/${itemId}`;
    }
    case 'notes': {
      return `/notes/${itemId}`;
    }
    default:
      return null;
  }
} 