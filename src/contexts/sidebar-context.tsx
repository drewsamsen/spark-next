'use client';

import { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect, 
  ReactNode,
  useMemo
} from 'react';
import { SidebarType, SidebarItem, EnhancedSparkItem } from '@/lib/types';
import { 
  loadBooleanFromStorage, 
  saveToStorage, 
  loadObjectFromStorage
} from '@/lib/utils';
import { getSidebarTypeFromItem } from '@/lib/sidebar-utils';
import { useRouter } from 'next/navigation';

// Interface for sidebar visibility state
interface SidebarVisibilityState {
  leftSidebar: boolean;
  rightSidebar: boolean;
  nestedSidebar: boolean;
}

// Interface for sidebar selection state
interface SidebarSelectionState {
  activeSidebarItem: string | null;
  activeItemId: string | null;
}

// Interface for sidebar search state
interface SidebarSearchState {
  [key: string]: string; // Maps sidebar type to search query
}

// Interface for the context value
interface SidebarContextValue {
  // Visibility state
  visibilityState: SidebarVisibilityState;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setNestedSidebarOpen: (value: boolean) => void;
  
  // Selection state
  selectionState: SidebarSelectionState;
  activeSidebarType: SidebarType; // Derived from activeSidebarItem
  toggleSidebar: (item: string) => void;
  setActiveSidebarItem: (item: string | null) => void;
  setActiveItemId: (id: string | null) => void;
  handleItemSelect: (itemId: string, extraData?: any) => void;
  
  // Search state
  searchQueries: SidebarSearchState;
  setSearchQuery: (sidebarType: string, query: string) => void;
  getSearchQuery: (sidebarType: string) => string;
  
  // Utility functions
  closeSidebar: () => void;
}

// Create the context with a default undefined value
const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

// Props for the SidebarProvider component
interface SidebarProviderProps {
  children: ReactNode;
  getItems?: (type: SidebarType) => SidebarItem[] | EnhancedSparkItem[];
  categoryData?: any[];
}

// Provider component to wrap the application with
export function SidebarProvider({ 
  children,
  getItems = () => [], // Default empty function if not provided
  categoryData = []    // Default empty array if not provided
}: SidebarProviderProps) {
  const router = useRouter();
  
  // Track if component has mounted to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  
  // Initialize visibility state with default values
  const [visibilityState, setVisibilityState] = useState<SidebarVisibilityState>({
    leftSidebar: true,
    rightSidebar: true,
    nestedSidebar: false
  });
  
  // Initialize selection state (removing activeSidebarType, will be derived)
  const [selectionState, setSelectionState] = useState<SidebarSelectionState>({
    activeSidebarItem: null,
    activeItemId: null
  });
  
  // Derive activeSidebarType from activeSidebarItem
  const activeSidebarType = useMemo(() => {
    if (!selectionState.activeSidebarItem) return null;
    return getSidebarTypeFromItem(selectionState.activeSidebarItem);
  }, [selectionState.activeSidebarItem]);
  
  // Initialize search state
  const [searchQueries, setSearchQueries] = useState<SidebarSearchState>({});

  // Initialize state from localStorage on client-side only
  useEffect(() => {
    setHasMounted(true);
    
    if (typeof window !== 'undefined') {
      // Load sidebar visibility state from localStorage
      setVisibilityState({
        leftSidebar: loadBooleanFromStorage('leftSidebarOpen', true),
        rightSidebar: loadBooleanFromStorage('rightSidebarOpen', true),
        nestedSidebar: false // Always initialize as closed
      });
      
      // Load search queries if they exist
      const savedSearchQueries = loadObjectFromStorage<SidebarSearchState>('sidebarSearchQueries', {});
      if (savedSearchQueries) {
        setSearchQueries(savedSearchQueries);
      }
    }
  }, []);

  // Save visibility state to localStorage when it changes
  useEffect(() => {
    if (hasMounted) {
      saveToStorage('leftSidebarOpen', visibilityState.leftSidebar);
      saveToStorage('rightSidebarOpen', visibilityState.rightSidebar);
    }
  }, [hasMounted, visibilityState.leftSidebar, visibilityState.rightSidebar]);

  // Save search queries to localStorage when they change
  useEffect(() => {
    if (hasMounted && Object.keys(searchQueries).length > 0) {
      saveToStorage('sidebarSearchQueries', searchQueries);
    }
  }, [hasMounted, searchQueries]);

  // Toggle left sidebar visibility
  const toggleLeftSidebar = useCallback(() => {
    setVisibilityState(prev => ({
      ...prev,
      leftSidebar: !prev.leftSidebar
    }));
  }, []);
  
  // Toggle right sidebar visibility
  const toggleRightSidebar = useCallback(() => {
    setVisibilityState(prev => ({
      ...prev,
      rightSidebar: !prev.rightSidebar
    }));
  }, []);
  
  // Set nested sidebar open state directly
  const setNestedSidebarOpen = useCallback((value: boolean) => {
    setVisibilityState(prev => ({
      ...prev,
      nestedSidebar: value
    }));
    
    // If closing, also clear selection state
    if (!value) {
      setSelectionState({
        activeSidebarItem: null,
        activeItemId: null
      });
    }
  }, []);
  
  // Set active sidebar item
  const setActiveSidebarItem = useCallback((item: string | null) => {
    setSelectionState(prev => ({
      ...prev,
      activeSidebarItem: item
    }));
  }, []);
  
  // Set active item ID
  const setActiveItemId = useCallback((id: string | null) => {
    setSelectionState(prev => ({
      ...prev,
      activeItemId: id
    }));
  }, []);
  
  // Toggle sidebar based on clicked item
  const toggleSidebar = useCallback((item: string) => {
    const newSidebarType = getSidebarTypeFromItem(item);
    
    // Update based on current state
    if (visibilityState.nestedSidebar && selectionState.activeSidebarItem === item) {
      // If clicking the currently active item, close the sidebar
      setVisibilityState(prev => ({
        ...prev,
        nestedSidebar: false
      }));
      setSelectionState({
        activeSidebarItem: null,
        activeItemId: null
      });
    } else if (newSidebarType) {
      // If clicking an item with a nested sidebar, open it
      setVisibilityState(prev => ({
        ...prev,
        nestedSidebar: true
      }));
      setSelectionState({
        activeSidebarItem: item,
        activeItemId: null
      });
    } else {
      // For items without nested sidebars, toggle selection and close any open sidebar
      setVisibilityState(prev => ({
        ...prev,
        nestedSidebar: false
      }));
      setSelectionState(prev => ({
        activeSidebarItem: prev.activeSidebarItem === item ? null : item,
        activeItemId: null
      }));
    }
  }, [visibilityState.nestedSidebar, selectionState.activeSidebarItem]);
  
  // Handle item selection
  const handleItemSelect = useCallback((itemId: string, extraData?: any) => {
    // First, update the selection state
    setActiveItemId(itemId);
    
    // Then handle navigation if appropriate
    // This would typically be handled in useSidebarSelection,
    // but for simplicity it's included directly here
    // In a real app, you might want to extract this to a separate function or hook
  }, [setActiveItemId]);
  
  // Close the nested sidebar
  const closeSidebar = useCallback(() => {
    setVisibilityState(prev => ({
      ...prev,
      nestedSidebar: false
    }));
    setSelectionState({
      activeSidebarItem: null,
      activeItemId: null
    });
  }, []);
  
  // Set search query for a specific sidebar type
  const setSearchQuery = useCallback((sidebarType: string, query: string) => {
    setSearchQueries(prev => ({
      ...prev,
      [sidebarType]: query
    }));
  }, []);
  
  // Get search query for a specific sidebar type
  const getSearchQuery = useCallback((sidebarType: string): string => {
    return searchQueries[sidebarType] || '';
  }, [searchQueries]);

  // Create the context value object
  const contextValue: SidebarContextValue = {
    visibilityState,
    toggleLeftSidebar,
    toggleRightSidebar,
    setNestedSidebarOpen,
    
    selectionState,
    activeSidebarType, // Include the derived type
    toggleSidebar,
    setActiveSidebarItem,
    setActiveItemId,
    handleItemSelect,
    
    searchQueries,
    setSearchQuery,
    getSearchQuery,
    
    closeSidebar
  };

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
}

// Hook for consuming the sidebar context
export function useSidebar() {
  const context = useContext(SidebarContext);
  
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  
  return context;
} 