'use client';

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarItem } from "@/lib/types";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";
import SparkPreviewPanel from "./spark-preview-panel";
import { EnhancedSparkItem } from "@/services/sparks.service";
import { SortField, SortState } from "@/services/sidebar.service";
import { services } from "@/services";

interface NestedSidebarProps {
  isOpen: boolean;
  title: string;
  icon: React.ReactNode;
  items: SidebarItem[] | EnhancedSparkItem[];
  activeItemId: string | null;
  setActiveItemId: (id: string, rwId?: number) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function NestedSidebar({ 
  isOpen, 
  title,
  icon,
  items,
  activeItemId, 
  setActiveItemId,
  onClose,
  isLoading = false
}: NestedSidebarProps) {
  const uiService = services.sidebar;
  
  // Initialize search and sort from UI service (which uses localStorage)
  const [searchTerm, setSearchTerm] = useState(() => uiService.getSavedSearch(title));
  const [sort, setSort] = useState(() => uiService.getSavedSort(title));
  
  const { settings, updateLeftSidebarWidth } = useUISettings();
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;
  const [hoveredSparkId, setHoveredSparkId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, right: 0 });
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(settings.leftSidebar.width - iconWidth);
  
  // Save search term to localStorage via UI service
  useEffect(() => {
    uiService.saveSearch(title, searchTerm);
  }, [searchTerm, title, uiService]);
  
  // Save sort preferences to localStorage via UI service
  useEffect(() => {
    uiService.saveSort(title, sort);
  }, [sort, title, uiService]);
  
  // Update width when settings change (but not during resize)
  useEffect(() => {
    if (!isResizing) {
      setSidebarWidth(settings.leftSidebar.width - iconWidth);
    }
  }, [settings.leftSidebar.width, isResizing, iconWidth]);

  // Force sort to be reapplied when items change (e.g., when data loads)
  useEffect(() => {
    if (items.length > 0) {
      // This will trigger the existing sort logic to run with current settings
      setSort((current: SortState) => ({...current}));
    }
  }, [items]);

  // Handle search input changes
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Handle resize
  useEffect(() => {
    if (!resizeHandleRef.current) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // The nested sidebar width is the mouse position minus the icon width
      const nestedWidth = Math.max(e.clientX - iconWidth, UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH - iconWidth);
      
      // Calculate the total sidebar width (nested + icon)
      const totalWidth = nestedWidth + iconWidth;
      
      // Apply constraints for the total width
      if (totalWidth >= UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH && 
          totalWidth <= UI_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH) {
        setSidebarWidth(nestedWidth);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate the nested sidebar width
        const nestedWidth = Math.max(e.clientX - iconWidth, UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH - iconWidth);
        
        // Calculate the total sidebar width (nested + icon) with constraints
        const totalWidth = Math.max(
          UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH,
          Math.min(nestedWidth + iconWidth, UI_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH)
        );
        
        // Update the nested sidebar width state
        setSidebarWidth(totalWidth - iconWidth);
        
        // Save the total width to user settings
        updateLeftSidebarWidth(totalWidth);
      }
      setIsResizing(false);
    };

    const resizeHandle = resizeHandleRef.current;
    resizeHandle.addEventListener('mousedown', handleMouseDown);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Add cursor styling to the entire document during resize
      document.body.style.cursor = 'ew-resize';
    }

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Reset cursor
      if (isResizing) {
        document.body.style.cursor = '';
      }
    };
  }, [isResizing, iconWidth, updateLeftSidebarWidth]);

  // Use UI service to handle sorting
  const handleSort = (field: SortField) => {
    setSort(uiService.toggleSort(sort, field));
  };

  // Filter and sort items using UI service
  const filteredAndSortedItems = uiService.sortItems(
    uiService.filterItems(items, searchTerm),
    sort
  );

  // If the sidebar isn't open, don't render anything
  if (!isOpen) return null;
  
  // Apply width to the sidebar
  const nestedSidebarStyle = { 
    width: `${sidebarWidth}px`,
    transition: isResizing ? 'none' : 'none'
  };

  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [hoveredSparkDetails, setHoveredSparkDetails] = useState<any>(null);

  const handleSparkMouseEnter = (e: React.MouseEvent, item: SidebarItem | EnhancedSparkItem) => {
    // Only show preview for Sparks
    if (title !== 'Sparks') return;
    
    // Clear any existing timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    
    // Store the current target element before it becomes invalid in the timeout
    const currentTarget = e.currentTarget as HTMLButtonElement;
    
    // Get the sidebar element to calculate its right edge
    const sidebarElement = sidebarRef.current;
    if (!sidebarElement) return;
    
    const sidebarRect = sidebarElement.getBoundingClientRect();
    const rect = currentTarget.getBoundingClientRect();
    
    // Calculate position for panel
    const position = {
      top: rect.top,
      // Position exactly at the right edge of the sidebar
      right: sidebarRect.right
    };
    
    // Only update if values are valid numbers
    if (!isNaN(position.top) && !isNaN(position.right) && 
        isFinite(position.top) && isFinite(position.right)) {
      setHoverPosition(position);
      setHoveredSparkId(item.id);
      
      // If this is an enhanced spark item, pass the details
      if ('details' in item) {
        setHoveredSparkDetails(item.details);
      } else {
        setHoveredSparkDetails(null);
      }
    }
  };

  const handleSparkMouseLeave = () => {
    // Clear the timer if the mouse leaves before it triggers
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
  };
  
  const handleClosePanel = () => {
    setHoveredSparkId(null);
    setHoveredSparkDetails(null);
  };

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }, [hoverTimer]);

  return (
    <div 
      className="h-full border-l border-r bg-neutral-50 dark:bg-sidebar animate-fade-in overflow-hidden relative"
      style={{
        ...nestedSidebarStyle,
        zIndex: 20 // Ensure sidebar has a stacking context with explicit z-index
      }}
      ref={sidebarRef}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-medium">{title}</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-6 w-6 z-20"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close {title} Sidebar</span>
          </Button>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full rounded-md pl-8 text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={isLoading}
            />
          </div>
        </div>
        
        <nav className="flex-1 overflow-auto scrollbar-thin">
          {title === "Books" && (
            <div className="grid gap-1 px-2 max-w-full">
              {/* Column Headers */}
              <div className="flex items-center px-3 py-2 text-xs text-muted-foreground font-medium">
                <div className="flex flex-1 justify-between items-center min-w-0">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    Title
                  </button>
                  <div className="flex items-center gap-2 ml-2 whitespace-nowrap">
                    <button 
                      onClick={() => handleSort('highlightsCount')}
                      className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      #
                    </button>
                    <button 
                      onClick={() => handleSort('date')}
                      className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors ml-2"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {title === "Sparks" && (
            <div className="grid gap-1 px-2 max-w-full">
              {/* Column Headers */}
              <div className="flex items-center px-3 py-2 text-xs text-muted-foreground font-medium">
                <div className="flex flex-1 justify-between items-center min-w-0">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    Text
                  </button>
                  <div className="flex items-center gap-2 ml-2 whitespace-nowrap">
                    <button 
                      onClick={() => handleSort('date')}
                      className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      Date
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid gap-1 px-2 max-w-full">
            {isLoading ? (
              // Skeleton loading UI
              <>
                {Array(8).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 px-3 py-2">
                    <div className="flex flex-1 justify-between items-center">
                      <Skeleton className="h-5 w-32" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // Actual item list
              filteredAndSortedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemId(item.id, item.rwId)}
                  onMouseEnter={(e) => handleSparkMouseEnter(e, item)}
                  onMouseLeave={handleSparkMouseLeave}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground max-w-full overflow-hidden",
                    activeItemId === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
                  )}
                >
                  <div className="flex flex-1 justify-between items-center min-w-0">
                    <span className="truncate overflow-hidden">{item.name}</span>
                    {(item.highlightsCount !== undefined || item.date) && (
                      <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground whitespace-nowrap">
                        {item.highlightsCount !== undefined && (
                          <span className="font-medium">{item.highlightsCount}</span>
                        )}
                        {item.date && <span className="opacity-70 inline-block w-12 text-right">{item.date}</span>}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </nav>
      </div>
      
      {/* Resize handle for nested sidebar */}
      <div
        ref={resizeHandleRef}
        className="absolute right-0 inset-y-0 w-2 bg-transparent hover:bg-blue-500/20 cursor-ew-resize z-30"
        title="Drag to resize"
      />
      
      {/* Spark Preview Panel */}
      {title === "Sparks" && hoveredSparkId && (
        <SparkPreviewPanel 
          sparkId={hoveredSparkId}
          position={hoverPosition}
          onClose={handleClosePanel}
          sparkDetails={hoveredSparkDetails}
        />
      )}
    </div>
  );
} 