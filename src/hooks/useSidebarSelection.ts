'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarType, SidebarItem, EnhancedSparkItem } from '@/lib/types';
import { getSidebarTypeFromItem, shouldKeepSidebarOpen, getNavigationPath } from '@/lib/sidebar-utils';

interface SidebarSelectionState {
  activeSidebarType: SidebarType;
  activeSidebarItem: string | null;
  activeItemId: string | null;
}

interface UseSidebarSelectionResult {
  activeSidebarType: SidebarType;
  activeSidebarItem: string | null;
  activeItemId: string | null;
  toggleSidebar: (item: string) => void;
  closeSidebar: () => void;
  setActiveSidebarType: (type: SidebarType) => void;
  setActiveSidebarItem: (item: string | null) => void;
  setActiveItemId: (id: string | null) => void;
  handleItemSelect: (itemId: string, extraData?: any) => void;
  resetSelectionState: () => void;
}

interface UseSidebarSelectionProps {
  nestedSidebarOpen: boolean;
  setNestedSidebarOpen: (value: boolean) => void;
  getItems: (type: SidebarType) => SidebarItem[] | EnhancedSparkItem[];
  categoryData?: any[];
}

/**
 * Custom hook for managing sidebar selection state
 * 
 * @param props - Configuration for the hook
 * @returns Object containing sidebar selection states and functions
 */
export function useSidebarSelection({
  nestedSidebarOpen,
  setNestedSidebarOpen,
  getItems,
  categoryData
}: UseSidebarSelectionProps): UseSidebarSelectionResult {
  const router = useRouter();
  
  // Initialize selection state
  const [selectionState, setSelectionState] = useState<SidebarSelectionState>({
    activeSidebarType: null,
    activeSidebarItem: null,
    activeItemId: null
  });
  
  // Reset selection state
  const resetSelectionState = useCallback(() => {
    setSelectionState({
      activeSidebarType: null,
      activeSidebarItem: null,
      activeItemId: null
    });
  }, []);
  
  // Toggle sidebar based on clicked item
  const toggleSidebar = useCallback((item: string) => {
    // Map menu item names to sidebar types
    const sidebarType = getSidebarTypeFromItem(item);
    
    // Update selection state based on current state
    setSelectionState(prev => {
      // If the current sidebar is already open with the same type, close it
      if (nestedSidebarOpen && prev.activeSidebarType === sidebarType) {
        setNestedSidebarOpen(false);
        return {
          activeSidebarType: null,
          activeSidebarItem: null,
          activeItemId: null
        };
      } else if (sidebarType) {
        // Open the requested sidebar type
        setNestedSidebarOpen(true);
        return {
          activeSidebarType: sidebarType,
          activeSidebarItem: item,
          activeItemId: null // Reset active item when changing sidebar types
        };
      } else {
        // For other items without nested sidebars
        setNestedSidebarOpen(false);
        
        // Toggle the active item if clicking the same one, otherwise set it
        return {
          activeSidebarType: null,
          activeSidebarItem: prev.activeSidebarItem === item ? null : item,
          activeItemId: null
        };
      }
    });
  }, [nestedSidebarOpen, setNestedSidebarOpen]);
  
  // Close the nested sidebar
  const closeSidebar = useCallback(() => {
    setNestedSidebarOpen(false);
    resetSelectionState();
  }, [setNestedSidebarOpen, resetSelectionState]);
  
  // Set the active sidebar type
  const setActiveSidebarType = useCallback((type: SidebarType) => {
    setSelectionState(prev => ({
      ...prev,
      activeSidebarType: type,
      activeItemId: null // Reset active item when changing sidebar types
    }));
  }, []);
  
  // Set the active sidebar item
  const setActiveSidebarItem = useCallback((item: string | null) => {
    setSelectionState(prev => ({
      ...prev,
      activeSidebarItem: item
    }));
  }, []);
  
  // Set the active item ID
  const setActiveItemId = useCallback((id: string | null) => {
    setSelectionState(prev => ({
      ...prev,
      activeItemId: id
    }));
  }, []);
  
  // Handle selection of an item in the sidebar
  const handleItemSelect = useCallback((itemId: string, extraData?: any) => {
    // Set the active item ID
    setActiveItemId(itemId);
    
    if (selectionState.activeSidebarType) {
      // Get the items for the current sidebar type
      const items = getItems(selectionState.activeSidebarType);
      
      // Get the navigation path
      const path = getNavigationPath(
        selectionState.activeSidebarType,
        itemId,
        items,
        categoryData,
        extraData
      );
      
      // Navigate to the path if available
      if (path) {
        router.push(path);
      }
    }
  }, [router, selectionState.activeSidebarType, setActiveItemId, getItems, categoryData]);
  
  return {
    activeSidebarType: selectionState.activeSidebarType,
    activeSidebarItem: selectionState.activeSidebarItem,
    activeItemId: selectionState.activeItemId,
    toggleSidebar,
    closeSidebar,
    setActiveSidebarType,
    setActiveSidebarItem,
    setActiveItemId,
    handleItemSelect,
    resetSelectionState
  };
} 