'use client';

import { useState, useCallback } from 'react';
import { SidebarType } from '@/lib/types';

interface ActiveItemState {
  [key: string]: string | null; // Maps sidebar type to active item ID
}

interface ActiveItemTrackingResult {
  activeItems: ActiveItemState;
  getActiveItem: (sidebarType: SidebarType) => string | null;
  setActiveItem: (sidebarType: SidebarType, itemId: string | null) => void;
  clearActiveItems: () => void;
  hasActiveItem: (sidebarType: SidebarType) => boolean;
}

/**
 * Custom hook for tracking active items across different sidebar types
 * 
 * @returns Object containing active items state and management functions
 */
export function useActiveItemTracking(): ActiveItemTrackingResult {
  // Initialize with an empty object
  const [activeItems, setActiveItems] = useState<ActiveItemState>({});
  
  // Get active item for a specific sidebar type
  const getActiveItem = useCallback((sidebarType: SidebarType): string | null => {
    if (!sidebarType) return null;
    return activeItems[sidebarType] || null;
  }, [activeItems]);
  
  // Set active item for a specific sidebar type
  const setActiveItem = useCallback((sidebarType: SidebarType, itemId: string | null) => {
    if (!sidebarType) return;
    
    setActiveItems(prev => {
      if (itemId === null) {
        // Remove this sidebar type from tracked items if setting to null
        const newState = { ...prev };
        delete newState[sidebarType];
        return newState;
      }
      
      // Otherwise update or add the active item
      return {
        ...prev,
        [sidebarType]: itemId
      };
    });
  }, []);
  
  // Clear all active items
  const clearActiveItems = useCallback(() => {
    setActiveItems({});
  }, []);
  
  // Check if a sidebar type has an active item
  const hasActiveItem = useCallback((sidebarType: SidebarType): boolean => {
    if (!sidebarType) return false;
    return sidebarType in activeItems;
  }, [activeItems]);
  
  return {
    activeItems,
    getActiveItem,
    setActiveItem,
    clearActiveItems,
    hasActiveItem
  };
} 