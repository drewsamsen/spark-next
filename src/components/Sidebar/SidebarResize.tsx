'use client';

import { useEffect, useRef, useState, MutableRefObject } from "react";
import { UI_SETTINGS } from "@/contexts/ui-settings-context";

interface UseSidebarResizeProps {
  iconWidth: number;
  initialWidth: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

interface UseSidebarResizeReturn {
  sidebarWidth: number;
  resizeHandleRef: MutableRefObject<HTMLDivElement | null>;
  isResizing: boolean;
}

/**
 * Custom hook for sidebar resize functionality
 */
export function useSidebarResize({
  iconWidth,
  initialWidth,
  onWidthChange,
  minWidth = UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH,
  maxWidth = UI_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH
}: UseSidebarResizeProps): UseSidebarResizeReturn {
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth - iconWidth);
  const resizeHandleRef = useRef<HTMLDivElement | null>(null);
  
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
      const nestedWidth = Math.max(e.clientX - iconWidth, minWidth - iconWidth);
      
      // Calculate the total sidebar width (nested + icon)
      const totalWidth = nestedWidth + iconWidth;
      
      // Apply constraints for the total width
      if (totalWidth >= minWidth && totalWidth <= maxWidth) {
        setSidebarWidth(nestedWidth);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate the nested sidebar width
        const nestedWidth = Math.max(e.clientX - iconWidth, minWidth - iconWidth);
        
        // Calculate the total sidebar width (nested + icon) with constraints
        const totalWidth = Math.max(
          minWidth,
          Math.min(nestedWidth + iconWidth, maxWidth)
        );
        
        // Update the nested sidebar width state
        setSidebarWidth(totalWidth - iconWidth);
        
        // Save the total width to user settings
        onWidthChange(totalWidth);
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
  }, [isResizing, iconWidth, onWidthChange, minWidth, maxWidth]);

  // Update width when initialWidth changes but not during resize
  useEffect(() => {
    if (!isResizing) {
      setSidebarWidth(initialWidth - iconWidth);
    }
  }, [initialWidth, isResizing, iconWidth]);

  return {
    sidebarWidth,
    resizeHandleRef,
    isResizing
  };
} 