'use client';

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PanelRightOpen,
  Search,
  Settings,
  Maximize,
  Minimize,
  Sparkles,
  Layers
} from "lucide-react";
import { ModeToggle } from "@/components/theme";
import { LogoutButton } from "@/components/auth";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogoIcon } from "@/components/icons/LogoIcon";
import { HighlightSearchMode } from "@/lib/types";

interface HeaderProps {
  toggleRightSidebar: () => void;
  navigateTo?: (path: string, e: React.MouseEvent) => void;
  currentPath?: string;
  isFocusMode?: boolean;
  toggleFocusMode?: () => void;
}

export default function Header({ 
  toggleRightSidebar,
  navigateTo,
  currentPath = "/",
  isFocusMode = false,
  toggleFocusMode
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<HighlightSearchMode>('keyword');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Load search mode preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('globalSearchMode') as HighlightSearchMode;
      if (savedMode && ['keyword', 'semantic', 'hybrid'].includes(savedMode)) {
        setSearchMode(savedMode);
      }
    }
  }, []);

  // Store mode preference in localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('globalSearchMode', searchMode);
    }
  }, [searchMode]);

  // Handle clicks outside the search container to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }

    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isSearchFocused]);
  
  const handleLogoClick = (e: React.MouseEvent) => {
    if (navigateTo) {
      navigateTo("/", e);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query and mode
      router.push('/search');
      // Use a small timeout to ensure navigation happens before setting state
      setTimeout(() => {
        // Store search params in sessionStorage for the search page to pick up
        sessionStorage.setItem('searchQuery', searchQuery);
        sessionStorage.setItem('searchMode', searchMode);
      }, 0);
      setIsSearchFocused(false);
    }
  };

  const handleModeChange = (mode: HighlightSearchMode) => {
    setSearchMode(mode);
  };
  
  return (
    <header className="border-b bg-neutral-50 dark:border-spark-dark-neutral/20 dark:bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          {navigateTo ? (
            <a 
              href="/" 
              onClick={handleLogoClick} 
              className="flex items-center gap-1 hover:opacity-80"
            >
              <LogoIcon className="h-5 w-5 text-spark-brand dark:text-spark-dark-brand" />
              <span className="font-medium text-lg hidden md:inline-block">Spark</span>
            </a>
          ) : (
            <Link href="/" className="flex items-center gap-1 hover:opacity-80">
              <LogoIcon className="h-5 w-5 text-spark-brand dark:text-spark-dark-brand" />
              <span className="font-medium text-lg hidden md:inline-block">Spark</span>
            </Link>
          )}
        </div>
        
        {/* Center section */}
        <div className="flex-1 flex justify-center px-4 max-w-3xl mx-auto">
          <div ref={searchContainerRef} className="relative w-full max-w-lg">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search highlights..."
                className="w-full rounded-md border bg-background pl-9 py-2 text-sm outline-none focus:ring-1 focus:ring-spark-primary dark:focus:ring-spark-dark-primary dark:border-spark-dark-neutral/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
            </form>
            
            {/* Search mode dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-background border rounded-md shadow-lg p-2 z-50">
                <div className="text-xs text-muted-foreground mb-2 px-2">Search mode:</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('keyword')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      searchMode === 'keyword'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    title="Search by exact keywords"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Keyword
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleModeChange('semantic')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      searchMode === 'semantic'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    title="Search by meaning using AI"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Semantic
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleModeChange('hybrid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      searchMode === 'hybrid'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                    title="Combine keyword and semantic search"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Hybrid
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right section */}
        <div className="flex items-center gap-2">
          {toggleFocusMode && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleFocusMode}
              className="h-8 w-8"
              title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {isFocusMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              <span className="sr-only">{isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}</span>
            </Button>
          )}
          
          <ModeToggle />
          
          <Button variant="ghost" size="icon" onClick={toggleRightSidebar} className="h-8 w-8">
            <PanelRightOpen className="h-4 w-4" />
            <span className="sr-only">Toggle right sidebar</span>
          </Button>
          
          {navigateTo ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => navigateTo("/settings", e)}
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          ) : (
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
          )}
          
          <LogoutButton />
        </div>
      </div>
    </header>
  );
} 