'use client';

import { SortField } from "@/services/sidebar.service";

interface SidebarColumnHeaderProps {
  type: 'Highlights' | 'Sparks' | 'Categories' | 'Tags';
  onSort: (field: SortField) => void;
}

/**
 * Column headers component for sidebars
 */
export function SidebarColumnHeader({ type, onSort }: SidebarColumnHeaderProps) {
  if (type === "Highlights") {
    return (
      <div className="grid gap-1 px-2 max-w-full">
        <div className="flex items-center px-3 py-2 text-xs text-muted-foreground font-medium">
          <div className="flex flex-1 justify-between items-center min-w-0">
            <button 
              onClick={() => onSort('name')}
              className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
            >
              Title
            </button>
            <div className="flex items-center gap-2 ml-2 whitespace-nowrap">
              <button 
                onClick={() => onSort('highlightsCount')}
                className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
              >
                #
              </button>
              <button 
                onClick={() => onSort('date')}
                className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors ml-2"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === "Sparks") {
    return (
      <div className="grid gap-1 px-2 max-w-full">
        <div className="flex items-center px-3 py-2 text-xs text-muted-foreground font-medium">
          <div className="flex flex-1 justify-between items-center min-w-0">
            <button 
              onClick={() => onSort('name')}
              className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
            >
              Text
            </button>
            <div className="flex items-center gap-2 ml-2 whitespace-nowrap">
              <button 
                onClick={() => onSort('date')}
                className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
              >
                Date
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === "Categories") {
    return (
      <div className="grid gap-1 px-2 max-w-full">
        <div className="flex items-center px-3 py-2 text-xs text-muted-foreground font-medium">
          <div className="flex flex-1 justify-between items-center min-w-0">
            <button 
              onClick={() => onSort('name')}
              className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
            >
              Name
            </button>
            <div className="flex items-center gap-2 ml-2 whitespace-nowrap">
              <button 
                onClick={() => onSort('highlightsCount')}
                className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
              >
                #
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === "Tags") {
    return (
      <div className="grid gap-1 px-2 max-w-full">
        <div className="flex items-center px-3 py-2 text-xs text-muted-foreground font-medium">
          <div className="flex flex-1 justify-between items-center min-w-0">
            <button 
              onClick={() => onSort('name')}
              className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
            >
              Name
            </button>
            <div className="flex items-center gap-2 ml-2 whitespace-nowrap">
              <button 
                onClick={() => onSort('highlightsCount')}
                className="flex items-center uppercase tracking-wider hover:text-foreground transition-colors"
              >
                #
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
} 