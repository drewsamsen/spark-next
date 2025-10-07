'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks';
import { UserSettings } from '@/lib/types';

// Define the shape of our UI settings
interface UISettings {
  // Right sidebar settings
  rightSidebar: {
    width: number;
  };
  // Left sidebar settings
  leftSidebar: {
    width: number;
  };
  // We can easily add more settings for other UI elements later
}

// Define what the context will expose
interface UISettingsContextValue {
  settings: UISettings;
  updateRightSidebarWidth: (width: number) => void;
  resetRightSidebarWidth: () => void;
  updateLeftSidebarWidth: (width: number) => void;
  resetLeftSidebarWidth: () => void;
}

// Default values for right sidebar
const DEFAULT_RIGHT_SIDEBAR_WIDTH = 384; // 96px * 4 = 384px
const MIN_RIGHT_SIDEBAR_WIDTH = 240;
const MAX_RIGHT_SIDEBAR_WIDTH = 600;

// Default values for left sidebar
const DEFAULT_LEFT_SIDEBAR_WIDTH = 360; // Default width
const MIN_LEFT_SIDEBAR_WIDTH = 240;
const MAX_LEFT_SIDEBAR_WIDTH = 600;
const LEFT_SIDEBAR_ICON_WIDTH = 60;

// Create the context
const UISettingsContext = createContext<UISettingsContextValue | undefined>(undefined);

// Validator for the right sidebar width
const validateRightSidebarWidth = (width: number): boolean => {
  return typeof width === 'number' && 
    width >= MIN_RIGHT_SIDEBAR_WIDTH && 
    width <= MAX_RIGHT_SIDEBAR_WIDTH;
};

// Validator for the left sidebar width
const validateLeftSidebarWidth = (width: number): boolean => {
  return typeof width === 'number' && 
    width >= MIN_LEFT_SIDEBAR_WIDTH && 
    width <= MAX_LEFT_SIDEBAR_WIDTH;
};

export const UISettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use our userSettings hook to manage settings with database persistence
  const { settings: userSettings, updateRightSidebarWidth: saveRightSidebarWidth, 
          updateLeftSidebarWidth: saveLeftSidebarWidth, isLoading: isUserSettingsLoading } = useUserSettings();
  
  // Track if component has mounted to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  
  // Initialize with null - we won't set real values until user settings are loaded
  const [settings, setSettings] = useState<UISettings | null>(null);
  
  // Set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  // Once mounted, update from user settings if available
  useEffect(() => {
    if (hasMounted && userSettings) {
      const newSettings: UISettings = {
        rightSidebar: {
          width: userSettings.rightSidebar?.width || DEFAULT_RIGHT_SIDEBAR_WIDTH
        },
        leftSidebar: {
          width: userSettings.leftSidebar?.width || DEFAULT_LEFT_SIDEBAR_WIDTH
        }
      };
      
      setSettings(newSettings);
    }
  }, [hasMounted, userSettings]);

  // Update functions for specific settings
  const handleUpdateRightSidebarWidth = (width: number) => {
    if (!settings || !validateRightSidebarWidth(width)) return;
    
    // First update the local state
    setSettings(prevSettings => ({
      ...prevSettings!,
      rightSidebar: {
        ...prevSettings!.rightSidebar,
        width
      }
    }));
    
    // Then persist to user settings if available
    saveRightSidebarWidth(width).catch(error => {
      console.error('Failed to update right sidebar width in user settings:', error);
    });
  };

  // Update function for left sidebar
  const handleUpdateLeftSidebarWidth = (width: number) => {
    if (!settings || !validateLeftSidebarWidth(width)) return;
    
    // First update the local state
    setSettings(prevSettings => ({
      ...prevSettings!,
      leftSidebar: {
        ...prevSettings!.leftSidebar,
        width
      }
    }));
    
    // Then persist to user settings if available
    saveLeftSidebarWidth(width).catch(error => {
      console.error('Failed to update left sidebar width in user settings:', error);
    });
  };
  
  // Reset functions
  const resetRightSidebarWidth = () => {
    handleUpdateRightSidebarWidth(DEFAULT_RIGHT_SIDEBAR_WIDTH);
  };
  
  const resetLeftSidebarWidth = () => {
    handleUpdateLeftSidebarWidth(DEFAULT_LEFT_SIDEBAR_WIDTH);
  };

  // Calculate loading state
  // We're loading if:
  // 1. Component hasn't mounted yet, OR
  // 2. User settings are still loading, OR
  // 3. Settings have not been initialized
  const isLoading = !hasMounted || isUserSettingsLoading || !settings;

  // Don't render the children until we have valid settings
  if (isLoading) {
    return null;
  }

  // Context value
  const value: UISettingsContextValue = {
    settings: settings!,
    updateRightSidebarWidth: handleUpdateRightSidebarWidth,
    resetRightSidebarWidth,
    updateLeftSidebarWidth: handleUpdateLeftSidebarWidth,
    resetLeftSidebarWidth
  };

  return (
    <UISettingsContext.Provider value={value}>
      {children}
    </UISettingsContext.Provider>
  );
};

// Custom hook to use the context
export const useUISettings = () => {
  const context = useContext(UISettingsContext);
  if (context === undefined) {
    throw new Error('useUISettings must be used within a UISettingsProvider');
  }
  return context;
};

// Export constants for reuse
export const UI_SETTINGS = {
  RIGHT_SIDEBAR: {
    DEFAULT_WIDTH: DEFAULT_RIGHT_SIDEBAR_WIDTH,
    MIN_WIDTH: MIN_RIGHT_SIDEBAR_WIDTH,
    MAX_WIDTH: MAX_RIGHT_SIDEBAR_WIDTH
  },
  LEFT_SIDEBAR: {
    DEFAULT_WIDTH: DEFAULT_LEFT_SIDEBAR_WIDTH,
    MIN_WIDTH: MIN_LEFT_SIDEBAR_WIDTH,
    MAX_WIDTH: MAX_LEFT_SIDEBAR_WIDTH,
    ICON_WIDTH: LEFT_SIDEBAR_ICON_WIDTH
  }
}; 