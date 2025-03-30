'use client';

import { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";

interface RightSidebarProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function RightSidebar({ isOpen, setIsOpen }: RightSidebarProps) {
  const { settings, updateRightSidebarWidth } = useUISettings();
  
  // Track if component has mounted to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  
  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(settings.rightSidebar.width);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Initialize sidebar width from settings after mount
  useEffect(() => {
    if (hasMounted && !isResizing) {
      setSidebarWidth(settings.rightSidebar.width);
    }
  }, [hasMounted, settings.rightSidebar.width, isResizing]);

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
      if (newWidth >= UI_SETTINGS.RIGHT_SIDEBAR.MIN_WIDTH && 
          newWidth <= UI_SETTINGS.RIGHT_SIDEBAR.MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate the final width directly to avoid stale state
        const finalWidth = window.innerWidth - e.clientX;
        // Apply constraints to ensure valid width
        const validWidth = Math.max(
          UI_SETTINGS.RIGHT_SIDEBAR.MIN_WIDTH,
          Math.min(finalWidth, UI_SETTINGS.RIGHT_SIDEBAR.MAX_WIDTH)
        );
        // First update local state
        setSidebarWidth(validWidth);
        // Then save to localStorage
        updateRightSidebarWidth(validWidth);
      }
      setIsResizing(false);
    };

    const resizeHandle = resizeHandleRef.current;
    resizeHandle.addEventListener('mousedown', handleMouseDown);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, updateRightSidebarWidth]);

  if (!isOpen) return null;

  // Use default width during server rendering and before mounting to prevent hydration mismatch
  const width = hasMounted ? sidebarWidth : UI_SETTINGS.RIGHT_SIDEBAR.DEFAULT_WIDTH;
  
  // Construct style object only once at render time
  const sidebarStyle = {
    width: `${width}px`,
    transition: isResizing ? 'none' : 'width 300ms ease-in-out'
  };

  return (
    <div 
      className="h-full border-l bg-sidebar overflow-hidden flex-shrink-0 relative"
      style={sidebarStyle}
    >
      {/* Resize handle */}
      <div
        ref={resizeHandleRef}
        className="absolute inset-y-0 left-0 w-1 cursor-ew-resize hover:bg-border"
      >
        <div className="absolute top-1/2 left-0 h-8 w-1 bg-border rounded opacity-0 hover:opacity-100" />
      </div>
        
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4">
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
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border p-2 text-sm">
                  <span className="font-medium">Type</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border p-2 text-sm">
                  <span className="font-medium">Created</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border p-2 text-sm">
                  <span className="font-medium">Updated</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border p-2 text-sm">
                  <span className="font-medium">Status</span>
                  <span className="truncate">-</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium leading-none">Statistics</h3>
              <div className="grid gap-1.5">
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border p-2 text-sm">
                  <span className="font-medium">Words</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border p-2 text-sm">
                  <span className="font-medium">Highlights</span>
                  <span className="truncate">-</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-1.5 rounded-md border p-2 text-sm">
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