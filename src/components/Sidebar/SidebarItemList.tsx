'use client';

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarItem, EnhancedSparkItem } from "@/lib/types";
import { useState } from "react";

interface SidebarItemListProps {
  items: SidebarItem[] | EnhancedSparkItem[];
  activeItemId: string | null;
  setActiveItemId: (id: string, rwId?: number) => void;
  isLoading?: boolean;
  onItemMouseEnter?: (e: React.MouseEvent, item: SidebarItem | EnhancedSparkItem) => void;
  onItemMouseLeave?: () => void;
}

/**
 * List of items component for sidebars
 */
export function SidebarItemList({
  items,
  activeItemId,
  setActiveItemId,
  isLoading = false,
  onItemMouseEnter,
  onItemMouseLeave
}: SidebarItemListProps) {
  const handleItemClick = (item: SidebarItem | EnhancedSparkItem) => {
    setActiveItemId(item.id, item.rwId);
  };

  if (isLoading) {
    return (
      <div className="grid gap-1 px-2 max-w-full">
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
      </div>
    );
  }

  return (
    <div className="grid gap-1 px-2 max-w-full">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleItemClick(item)}
          onMouseEnter={onItemMouseEnter ? (e) => onItemMouseEnter(e, item) : undefined}
          onMouseLeave={onItemMouseLeave}
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
      ))}
    </div>
  );
} 