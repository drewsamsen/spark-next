'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/use-storage';

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

// Define the context value shape
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
  // Use our custom hook to manage the sidebar width with localStorage
  const [rightSidebarWidth, setRightSidebarWidth, resetRightSidebarWidth] = useLocalStorage<number>(
    'ui',
    'rightSidebarWidth',
    DEFAULT_RIGHT_SIDEBAR_WIDTH,
    validateRightSidebarWidth
  );

  // Left sidebar width management
  const [leftSidebarWidth, setLeftSidebarWidth, resetLeftSidebarWidth] = useLocalStorage<number>(
    'ui',
    'leftSidebarWidth',
    DEFAULT_LEFT_SIDEBAR_WIDTH,
    validateLeftSidebarWidth
  );

  // Combine all UI settings into a single object
  const settings: UISettings = {
    rightSidebar: {
      width: rightSidebarWidth
    },
    leftSidebar: {
      width: leftSidebarWidth
    }
  };

  // Update functions for specific settings
  const updateRightSidebarWidth = (width: number) => {
    if (validateRightSidebarWidth(width)) {
      setRightSidebarWidth(width);
    }
  };

  // Update function for left sidebar
  const updateLeftSidebarWidth = (width: number) => {
    if (validateLeftSidebarWidth(width)) {
      setLeftSidebarWidth(width);
    }
  };

  // Context value
  const value: UISettingsContextValue = {
    settings,
    updateRightSidebarWidth,
    resetRightSidebarWidth,
    updateLeftSidebarWidth,
    resetLeftSidebarWidth
  };

  return (
    <UISettingsContext.Provider value={value}>
      {children}
    </UISettingsContext.Provider>
  );
};

// Custom hook to use the UI settings
export const useUISettings = (): UISettingsContextValue => {
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