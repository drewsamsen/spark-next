'use client';

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SidebarHeaderProps {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
}

/**
 * Header component for sidebars with title and close button
 */
export function SidebarHeader({ title, icon, onClose }: SidebarHeaderProps) {
  return (
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
  );
} 