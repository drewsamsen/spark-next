import { useState, useEffect } from 'react';
import { sidebarService } from '@/services/sidebar.service';
import { useUserSettings } from '../data/use-user-settings';

// Constants for sidebar dimensions
export const SIDEBAR_SETTINGS = {
  RIGHT_SIDEBAR: {
    DEFAULT_WIDTH: 384,
    MIN_WIDTH: 240,
    MAX_WIDTH: 600
  },
  LEFT_SIDEBAR: {
    DEFAULT_WIDTH: 360,
    MIN_WIDTH: 240,
    MAX_WIDTH: 600,
    ICON_WIDTH: 60
  }
};

/**
 * Hook for managing sidebar dimensions and settings
 */
export function useSidebarService() {
  const { settings: userSettings, updateRightSidebarWidth: saveRightSidebarWidth, 
          updateLeftSidebarWidth: saveLeftSidebarWidth, isLoading } = useUserSettings();
  
  const [rightSidebarWidth, setRightSidebarWidth] = useState(SIDEBAR_SETTINGS.RIGHT_SIDEBAR.DEFAULT_WIDTH);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(SIDEBAR_SETTINGS.LEFT_SIDEBAR.DEFAULT_WIDTH);
  const [hasMounted, setHasMounted] = useState(false);

  // Set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  // Once mounted, update from user settings if available
  useEffect(() => {
    if (hasMounted && userSettings) {
      if (userSettings.rightSidebar?.width) {
        setRightSidebarWidth(userSettings.rightSidebar.width);
      }
      
      if (userSettings.leftSidebar?.width) {
        setLeftSidebarWidth(userSettings.leftSidebar.width);
      }
    }
  }, [hasMounted, userSettings]);

  /**
   * Update the right sidebar width
   */
  const updateRightSidebarWidth = (width: number) => {
    // Validate width
    if (width < SIDEBAR_SETTINGS.RIGHT_SIDEBAR.MIN_WIDTH || 
        width > SIDEBAR_SETTINGS.RIGHT_SIDEBAR.MAX_WIDTH) {
      return;
    }
    
    // Update local state
    setRightSidebarWidth(width);
    
    // Save to user settings
    saveRightSidebarWidth(width).catch(error => {
      console.error('Failed to update right sidebar width:', error);
    });
  };

  /**
   * Update the left sidebar width
   */
  const updateLeftSidebarWidth = (width: number) => {
    // Validate width
    if (width < SIDEBAR_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH || 
        width > SIDEBAR_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH) {
      return;
    }
    
    // Update local state
    setLeftSidebarWidth(width);
    
    // Save to user settings
    saveLeftSidebarWidth(width).catch(error => {
      console.error('Failed to update left sidebar width:', error);
    });
  };

  /**
   * Reset the right sidebar width to default
   */
  const resetRightSidebarWidth = () => {
    updateRightSidebarWidth(SIDEBAR_SETTINGS.RIGHT_SIDEBAR.DEFAULT_WIDTH);
  };

  /**
   * Reset the left sidebar width to default
   */
  const resetLeftSidebarWidth = () => {
    updateLeftSidebarWidth(SIDEBAR_SETTINGS.LEFT_SIDEBAR.DEFAULT_WIDTH);
  };

  return {
    rightSidebarWidth,
    leftSidebarWidth,
    updateRightSidebarWidth,
    updateLeftSidebarWidth,
    resetRightSidebarWidth,
    resetLeftSidebarWidth,
    sortItems: sidebarService.sortItems,
    filterItems: sidebarService.filterItems,
    toggleSort: sidebarService.toggleSort,
    getSavedSort: sidebarService.getSavedSort,
    saveSort: sidebarService.saveSort,
    getSavedSearch: sidebarService.getSavedSearch,
    saveSearch: sidebarService.saveSearch,
    isLoading: isLoading || !hasMounted
  };
} 