'use client';

import { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarService, SIDEBAR_SETTINGS } from "@/hooks/use-sidebar-service";

interface RightSidebarProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function RightSidebar({ isOpen, setIsOpen }: RightSidebarProps) {
  const { 
    rightSidebarWidth, 
    updateRightSidebarWidth,
    isLoading
  } = useSidebarService();
  
  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(rightSidebarWidth);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Update local state when settings change (but not during resize)
  useEffect(() => {
    if (!isResizing) {
      setSidebarWidth(rightSidebarWidth);
    }
  }, [rightSidebarWidth, isResizing]);

  // Handle resize
  useEffect(() => {
    if (!resizeHandleRef.current) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Get the new width based on mouse position from right edge
      const newWidth = window.innerWidth - e.clientX;
      
      // Apply constraints
      if (newWidth >= SIDEBAR_SETTINGS.RIGHT_SIDEBAR.MIN_WIDTH && 
          newWidth <= SIDEBAR_SETTINGS.RIGHT_SIDEBAR.MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate the final width directly to avoid stale state
        const finalWidth = window.innerWidth - e.clientX;
        // Apply constraints to ensure valid width
        const validWidth = Math.max(
          SIDEBAR_SETTINGS.RIGHT_SIDEBAR.MIN_WIDTH,
          Math.min(finalWidth, SIDEBAR_SETTINGS.RIGHT_SIDEBAR.MAX_WIDTH)
        );
        // First update local state
        setSidebarWidth(validWidth);
        // Then save to user settings
        updateRightSidebarWidth(validWidth);
      }
      setIsResizing(false);
    };

    const resizeHandle = resizeHandleRef.current;
    resizeHandle.addEventListener('mousedown', handleMouseDown);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
    }

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (isResizing) {
        document.body.style.cursor = '';
      }
    };
  }, [isResizing, updateRightSidebarWidth]);

  // Don't render if sidebar is closed or if settings are still loading
  if (!isOpen || isLoading) return null;
  
  // Just apply the width directly, no transition needed since we only render when we have the correct width
  const sidebarStyle = {
    width: `${sidebarWidth}px`,
    transition: 'none'
  };

  return (
    <div 
      className="h-screen border-l border-sidebar bg-neutral-50 dark:bg-sidebar overflow-hidden flex-shrink-0 relative"
      style={sidebarStyle}
    >
      {/* Resize handle */}
      <div
        ref={resizeHandleRef}
        className="absolute inset-y-0 left-0 w-2 bg-transparent hover:bg-spark-primary/20 dark:hover:bg-spark-dark-primary/20 cursor-ew-resize z-30"
        title="Drag to resize"
        style={{ transition: 'none' }}
      >
        <div className="absolute top-1/2 left-0 h-8 w-1 bg-transparent hover:bg-spark-primary/20 dark:hover:bg-spark-dark-primary/20 rounded opacity-0 hover:opacity-100" />
      </div>
        
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-sidebar p-4">
          <h2 className="text-sm font-medium">Inspector</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close Sidebar</span>
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-sm font-medium leading-none">Selection Details</h3>
              <p className="text-sm text-muted-foreground">
                Select an item to view its details here.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium leading-none">Properties</h3>
              <div className="grid gap-1.5">
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border border-sidebar p-2 text-sm">
                  <span className="font-medium">Type</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border border-sidebar p-2 text-sm">
                  <span className="font-medium">Created</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border border-sidebar p-2 text-sm">
                  <span className="font-medium">Updated</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border border-sidebar p-2 text-sm">
                  <span className="font-medium">Status</span>
                  <span className="truncate">-</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium leading-none">Statistics</h3>
              <div className="grid gap-1.5">
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border border-sidebar p-2 text-sm">
                  <span className="font-medium">Words</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border border-sidebar p-2 text-sm">
                  <span className="font-medium">Highlights</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border border-sidebar p-2 text-sm">
                  <span className="font-medium">Notes</span>
                  <span className="truncate">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 