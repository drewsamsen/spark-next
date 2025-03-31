'use client';

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarItem } from "@/lib/mock-api/types";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";

// Sort types
type SortField = 'name' | 'highlightsCount' | 'date';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface NestedSidebarProps {
  isOpen: boolean;
  title: string;
  icon: React.ReactNode;
  items: SidebarItem[];
  activeItemId: string | null;
  setActiveItemId: (id: string, rwId?: number) => void;
  onClose: () => void;
  isLoading?: boolean;
}

/**
 * Create a consistent localStorage key
 */
function getStorageKey(title: string, type: string): string {
  return `${title.toLowerCase()}-${type}`;
}

/**
 * Load sort preferences from localStorage or return default
 */
function getSavedSort(title: string): SortState {
  try {
    const savedSort = localStorage.getItem(`${title.toLowerCase()}-sort`);
    if (savedSort) {
      return JSON.parse(savedSort);
    }
  } catch (error) {
    console.error('Error loading sort settings from localStorage:', error);
  }
  // Default sort by name ascending
  return { field: 'name', direction: 'asc' };
}

/**
 * Load saved search term from localStorage
 */
function getSavedSearch(title: string): string {
  try {
    const savedSearch = localStorage.getItem(`${title.toLowerCase()}-search`);
    if (savedSearch) {
      return savedSearch;
    }
  } catch (error) {
    console.error('Error loading search settings from localStorage:', error);
  }
  return "";
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
  const [searchTerm, setSearchTerm] = useState(() => getSavedSearch(title));
  const [sort, setSort] = useState<SortState>(() => getSavedSort(title));
  const { settings, updateLeftSidebarWidth } = useUISettings();
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;
  
  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(settings.leftSidebar.width - iconWidth);
  
  // Save search term to localStorage
  useEffect(() => {
    localStorage.setItem(`${title.toLowerCase()}-search`, searchTerm);
  }, [searchTerm, title]);
  
  // Save sort preferences to localStorage
  useEffect(() => {
    localStorage.setItem(`${title.toLowerCase()}-sort`, JSON.stringify(sort));
  }, [sort, title]);
  
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
      setSort(current => ({...current}));
    }
  }, [items]);

  // Handle search input changes
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Search term is automatically saved to localStorage via the useEffect hook
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

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    // Sort settings are automatically saved to localStorage via the useEffect hook
  };

  // Helper function to parse date strings in various formats
  const parseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    
    try {
      // Try to parse the date with various formats
      // For "Aug '23" format, convert to a date object (August 2023)
      if (dateStr.includes("'")) {
        const parts = dateStr.split(" '");
        const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(parts[0]);
        const year = 2000 + parseInt(parts[1], 10);
        if (month >= 0 && !isNaN(year)) {
          return new Date(year, month, 1);
        }
      }
      
      // For "MM/YY" format
      if (dateStr.includes("/")) {
        const [month, year] = dateStr.split("/").map(Number);
        const fullYear = 2000 + year; // Assuming 20xx for all years
        return new Date(fullYear, month - 1, 1);
      }
      
      // Fallback to trying to parse the string directly
      return new Date(dateStr);
    } catch (e) {
      console.error("Error parsing date:", dateStr, e);
      return null;
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sort.field === 'name') {
        return sort.direction === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sort.field === 'highlightsCount') {
        const countA = a.highlightsCount || 0;
        const countB = b.highlightsCount || 0;
        return sort.direction === 'asc' ? countA - countB : countB - countA;
      } else if (sort.field === 'date') {
        // Parse dates properly for sorting
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return sort.direction === 'asc' ? -1 : 1;
        if (!dateB) return sort.direction === 'asc' ? 1 : -1;
        
        // Compare the actual Date objects
        return sort.direction === 'asc' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      }
      return 0;
    });

  // If the sidebar isn't open, don't render anything
  if (!isOpen) return null;
  
  // Apply width to the sidebar
  const nestedSidebarStyle = { 
    width: `${sidebarWidth}px`,
    transition: isResizing ? 'none' : 'none'
  };

  return (
    <div className="h-full border-l border-r bg-sidebar animate-fade-in overflow-hidden relative"
         style={nestedSidebarStyle}>
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
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground max-w-full overflow-hidden",
                    activeItemId === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
                  )}
                >
                  <div className="flex flex-1 justify-between items-center min-w-0">
                    <span className="truncate overflow-hidden">{item.name}</span>
                    {item.highlightsCount !== undefined && (
                      <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="font-medium">{item.highlightsCount}</span>
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
    </div>
  );
} 