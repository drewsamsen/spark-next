'use client';

import { MutableRefObject } from "react";

interface SidebarResizeHandleProps {
  handleRef: MutableRefObject<HTMLDivElement | null>;
}

/**
 * Resize handle component for sidebars
 */
export function SidebarResizeHandle({ handleRef }: SidebarResizeHandleProps) {
  return (
    <div
      ref={handleRef}
      className="absolute right-0 inset-y-0 w-2 bg-transparent hover:bg-blue-500/20 cursor-ew-resize z-30"
      title="Drag to resize"
    />
  );
} 