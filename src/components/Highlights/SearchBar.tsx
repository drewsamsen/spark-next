'use client';

import { Input } from '@/components/ui/input';
import { Search, Sparkles, Layers } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import { HighlightSearchMode } from '@/lib/types';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  searchMode?: HighlightSearchMode;
  onSearchModeChange?: (mode: HighlightSearchMode) => void;
}

/**
 * Search bar component for filtering highlights with multiple search modes
 */
export function SearchBar({ 
  searchTerm, 
  onSearchChange,
  searchMode = 'keyword',
  onSearchModeChange
}: SearchBarProps) {
  const [mode, setMode] = useState<HighlightSearchMode>(searchMode);

  // Sync internal state with prop
  useEffect(() => {
    setMode(searchMode);
  }, [searchMode]);

  // Store mode preference in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('highlightSearchMode', mode);
    }
  }, [mode]);

  // Load mode preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('highlightSearchMode') as HighlightSearchMode;
      if (savedMode && ['keyword', 'semantic', 'hybrid'].includes(savedMode)) {
        setMode(savedMode);
        onSearchModeChange?.(savedMode);
      }
    }
  }, [onSearchModeChange]);

  const handleModeChange = (newMode: HighlightSearchMode) => {
    setMode(newMode);
    onSearchModeChange?.(newMode);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search highlights..."
          className="pl-8"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>
      
      {onSearchModeChange && (
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('keyword')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              mode === 'keyword'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            title="Search by exact keywords"
          >
            <Search className="h-3.5 w-3.5" />
            Keyword
          </button>
          
          <button
            onClick={() => handleModeChange('semantic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              mode === 'semantic'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            title="Search by meaning using AI"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Semantic
          </button>
          
          <button
            onClick={() => handleModeChange('hybrid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              mode === 'hybrid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            title="Combine keyword and semantic search"
          >
            <Layers className="h-3.5 w-3.5" />
            Hybrid
          </button>
        </div>
      )}
    </div>
  );
} 