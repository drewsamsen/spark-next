'use client';

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { SidebarItem } from "@/lib/types";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";
import { SparkPreviewPanel } from "@/components/SparkPreview";
import { EnhancedSparkItem } from "@/lib/types";
import { SortField, SortState } from "@/services/sidebar.service";
import { services } from "@/services";
import { 
  SidebarHeader, 
  SidebarSearch, 
  SidebarColumnHeader, 
  SidebarItemList, 
  SidebarResizeHandle,
  useSidebarResize
} from '@/components/Sidebar';

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
  
  // Setup resize functionality using our custom hook
  const { sidebarWidth, resizeHandleRef, isResizing } = useSidebarResize({
    iconWidth,
    initialWidth: settings.leftSidebar.width,
    onWidthChange: updateLeftSidebarWidth
  });
  
  // Save search term to localStorage via UI service
  useEffect(() => {
    uiService.saveSearch(title, searchTerm);
  }, [searchTerm, title, uiService]);
  
  // Save sort preferences to localStorage via UI service
  useEffect(() => {
    uiService.saveSort(title, sort);
  }, [sort, title, uiService]);

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

  const handleSparkMouseEnter = (e: React.MouseEvent, item: SidebarItem | EnhancedSparkItem) => {
    // Only show preview for Sparks
    if (title !== 'Sparks') return;
    
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
      setHoveredSparkDetails('details' in item ? item.details : null);
    }
  };

  const handleSparkMouseLeave = () => {
    // Do nothing, the preview panel will handle its own visibility
  };
  
  const handleClosePanel = () => {
    setHoveredSparkId(null);
    setHoveredSparkDetails(null);
  };

  const [hoveredSparkDetails, setHoveredSparkDetails] = useState<any>(null);

  // Apply width to the sidebar
  const nestedSidebarStyle = { 
    width: `${sidebarWidth}px`,
    transition: isResizing ? 'none' : undefined
  };

  return (
    <div 
      className="h-screen border-l border-r bg-neutral-50 dark:bg-sidebar animate-fade-in overflow-hidden relative"
      style={{
        ...nestedSidebarStyle,
        zIndex: 20 // Ensure sidebar has a stacking context with explicit z-index
      }}
      ref={sidebarRef}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <SidebarHeader title={title} icon={icon} onClose={onClose} />
        
        {/* Search */}
        <SidebarSearch 
          title={title} 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
          isLoading={isLoading} 
        />
        
        <nav className="flex-1 overflow-auto scrollbar-thin">
          {/* Column Headers */}
          {(title === "Highlights" || title === "Sparks" || title === "Categories" || title === "Tags") && (
            <SidebarColumnHeader 
              type={title as 'Highlights' | 'Sparks' | 'Categories' | 'Tags'} 
              onSort={handleSort} 
            />
          )}
          
          {/* Item List */}
          <SidebarItemList 
            items={filteredAndSortedItems}
            activeItemId={activeItemId}
            setActiveItemId={setActiveItemId}
            isLoading={isLoading}
            onItemMouseEnter={handleSparkMouseEnter}
            onItemMouseLeave={handleSparkMouseLeave}
          />
        </nav>
      </div>
      
      {/* Resize handle */}
      <SidebarResizeHandle handleRef={resizeHandleRef} />
      
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