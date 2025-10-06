'use client';

import { useState, useEffect } from "react";
import { Header, LeftSidebar, RightSidebar, NestedSidebar } from "@/components/Layout";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";
import { AppLayoutProps } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import { useSidebarData, useCategories } from "@/hooks";
import { 
  getSidebarTitle, 
  getSidebarIcon, 
  shouldKeepSidebarOpen, 
  getNavigationPath 
} from "@/lib/sidebar-utils";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";

// Main application layout component used by all authenticated pages
export default function AppLayout({
  children,
}: AppLayoutProps) {
  const { settings } = useUISettings();
  const router = useRouter();
  const pathname = usePathname();
  
  // Use sidebar context for all sidebar state management
  const {
    visibilityState,
    toggleLeftSidebar,
    toggleRightSidebar,
    setNestedSidebarOpen,
    selectionState,
    activeSidebarType,
    toggleSidebar,
    setActiveSidebarItem,
    setActiveItemId,
    closeSidebar
  } = useSidebar();
  
  // Use unified sidebar data hook for all data loading
  const { items: sidebarItems, isLoading } = useSidebarData(activeSidebarType);
  
  // Get categories data for navigation (needed for getNavigationPath)
  const { categories: categoriesData } = useCategories();
  
  // Focus mode state (not part of sidebar context)
  const [focusMode, setFocusMode] = useState(false);

  // Reset active item when changing sidebar types
  useEffect(() => {
    if (activeSidebarType) {
      setActiveItemId(null);
    }
  }, [activeSidebarType, setActiveItemId]);

  // Toggle focus mode function
  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    if (!focusMode) {
      // Entering focus mode - hide sidebars (not managed by context, so we still toggle them)
      // Note: This creates a temporary inconsistency with context state
      // We may want to add focusMode to the context in the future
    }
  };

  // Client-side navigation function
  const navigateTo = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Close any open nested sidebars when navigating to pages that aren't related to them
    if (visibilityState.nestedSidebar && activeSidebarType) {
      // Check if path is related to current sidebar type
      const shouldClose = !shouldKeepSidebarOpen(activeSidebarType, path);
      
      if (shouldClose) {
        closeSidebar();
      }
    }
    
    router.push(path);
  };

  // Unified item selection handler
  const handleItemSelect = (itemId: string, extraData?: any) => {
    setActiveItemId(itemId);
    
    if (activeSidebarType) {
      // Get the navigation path using the utility function
      const path = getNavigationPath(
        activeSidebarType,
        itemId,
        sidebarItems,
        categoriesData,
        extraData
      );
      
      if (path) {
        router.push(path);
      }
    }
  };

  // Width of icons-only part of the left sidebar when projects sidebar is open
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <div className="flex h-screen flex-col">
        <Header 
          toggleRightSidebar={toggleRightSidebar}
          navigateTo={navigateTo}
          currentPath={pathname}
          isFocusMode={focusMode}
          toggleFocusMode={toggleFocusMode}
        />
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar container - use CSS to hide/show instead of removing from DOM */}
          <div className={cn(
            "relative h-full transition-none",
            !visibilityState.leftSidebar && "hidden"
          )}>
            {/* Main sidebar component handles its own width and resizing */}
            <LeftSidebar 
              isOpen={visibilityState.leftSidebar} 
              setIsOpen={toggleLeftSidebar}
              activeSidebarItem={selectionState.activeSidebarItem}
              toggleProjectsSidebar={toggleSidebar}
              isProjectsSidebarOpen={visibilityState.nestedSidebar}
              navigateTo={navigateTo}
              currentPath={pathname}
            />

            {/* Nested sidebar - only rendered when needed with dynamic content */}
            {visibilityState.nestedSidebar && activeSidebarType && (
              <div 
                className="absolute top-0 h-full z-[25]"
                style={{ 
                  left: `${iconWidth}px`
                }}
              >
                <NestedSidebar
                  key={`nested-sidebar-${activeSidebarType}`}
                  isOpen={visibilityState.nestedSidebar}
                  title={getSidebarTitle(activeSidebarType)}
                  icon={getSidebarIcon(activeSidebarType)}
                  items={sidebarItems}
                  activeItemId={selectionState.activeItemId}
                  setActiveItemId={handleItemSelect}
                  onClose={closeSidebar}
                  isLoading={isLoading}
                  instanceId={`sidebar-instance-${activeSidebarType}`}
                />
              </div>
            )}
          </div>
          
          {/* Main content area */}
          <main className={cn(
            "flex-1 overflow-auto transition-none",
            focusMode && "flex justify-center" // Center content in focus mode
          )}>
            <div 
              className="w-full transition-none"
              style={focusMode ? { maxWidth: '1200px', padding: '0 1rem' } : {}}
            >
              {children}
            </div>
          </main>
          
          {/* Right sidebar - use CSS to hide/show instead of removing from DOM */}
          <div className={cn(
            "transition-none", 
            !visibilityState.rightSidebar && "hidden"
          )}>
            <RightSidebar 
              isOpen={visibilityState.rightSidebar} 
              setIsOpen={toggleRightSidebar}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 