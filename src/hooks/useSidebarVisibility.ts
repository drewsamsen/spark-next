'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadBooleanFromStorage, saveToStorage } from '@/lib/utils';

interface SidebarVisibilityState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  nestedSidebarOpen: boolean;
}

interface UseSidebarVisibilityResult {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  nestedSidebarOpen: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setNestedSidebarOpen: (value: boolean) => void;
  resetNestedSidebar: () => void;
}

/**
 * Custom hook for managing sidebar visibility state with localStorage persistence
 * 
 * @returns Object containing sidebar visibility states and toggle functions
 */
export function useSidebarVisibility(): UseSidebarVisibilityResult {
  // Track if component has mounted to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  
  // Initialize state with default values (will be overridden by localStorage if available)
  const [state, setState] = useState<SidebarVisibilityState>({
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    nestedSidebarOpen: false
  });
  
  // Initialize state from localStorage on client-side only
  useEffect(() => {
    setHasMounted(true);
    
    if (typeof window !== 'undefined') {
      setState({
        leftSidebarOpen: loadBooleanFromStorage('leftSidebarOpen', true),
        rightSidebarOpen: loadBooleanFromStorage('rightSidebarOpen', true),
        nestedSidebarOpen: false // Always start with nested sidebar closed
      });
    }
  }, []);
  
  // Save main sidebar states to localStorage
  useEffect(() => {
    if (hasMounted) {
      // Save main sidebar visibility states only
      saveToStorage('leftSidebarOpen', state.leftSidebarOpen);
      saveToStorage('rightSidebarOpen', state.rightSidebarOpen);
    }
  }, [
    hasMounted, 
    state.leftSidebarOpen, 
    state.rightSidebarOpen
  ]);
  
  // Toggle left sidebar visibility
  const toggleLeftSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      leftSidebarOpen: !prev.leftSidebarOpen
    }));
  }, []);
  
  // Toggle right sidebar visibility
  const toggleRightSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      rightSidebarOpen: !prev.rightSidebarOpen
    }));
  }, []);
  
  // Directly set nested sidebar state
  const setNestedSidebarOpen = useCallback((value: boolean) => {
    setState(prev => ({
      ...prev,
      nestedSidebarOpen: value
    }));
  }, []);
  
  // Reset nested sidebar (close it)
  const resetNestedSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      nestedSidebarOpen: false
    }));
  }, []);
  
  return {
    leftSidebarOpen: state.leftSidebarOpen,
    rightSidebarOpen: state.rightSidebarOpen,
    nestedSidebarOpen: state.nestedSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    setNestedSidebarOpen,
    resetNestedSidebar
  };
} 