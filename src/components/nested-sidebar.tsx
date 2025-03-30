'use client';

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarItem } from "@/lib/mock-api/types";

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
  setActiveItemId: (id: string) => void;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<SortState>({ field: 'name', direction: 'asc' });
  
  // Load sort preferences from localStorage
  useEffect(() => {
    const savedSort = localStorage.getItem(`${title.toLowerCase()}-sort`);
    if (savedSort) {
      try {
        setSort(JSON.parse(savedSort));
      } catch (error) {
        console.error('Error parsing sort settings from localStorage', error);
      }
    }
  }, [title]);

  // Save sort preferences to localStorage
  useEffect(() => {
    localStorage.setItem(`${title.toLowerCase()}-sort`, JSON.stringify(sort));
  }, [sort, title]);

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
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
        // Handle date sorting (MM/YY format)
        if (!a.date || !b.date) return 0;
        
        const [monthA, yearA] = a.date.split('/').map(Number);
        const [monthB, yearB] = b.date.split('/').map(Number);
        
        if (yearA !== yearB) {
          return sort.direction === 'asc' ? yearA - yearB : yearB - yearA;
        }
        return sort.direction === 'asc' ? monthA - monthB : monthB - monthA;
      }
      return 0;
    });

  // If the sidebar isn't open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="h-full border-l bg-sidebar transition-all duration-300 ease-in-out animate-fade-in w-full overflow-hidden">
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
              placeholder="Search..."
              className="w-full rounded-md pl-8 text-sm"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
                        <Skeleton className="h-4 w-10" />
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
                  onClick={() => setActiveItemId(item.id)}
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
                        {item.date && <span className="opacity-70">{item.date}</span>}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </nav>
      </div>
    </div>
  );
} 