'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  PanelRightOpen,
  Search,
  Settings,
  Maximize,
  Minimize
} from "lucide-react";
import { ModeToggle } from "@/components/theme";
import { LogoutButton } from "@/components/auth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogoIcon } from "@/components/icons/LogoIcon";
import { useHeaderService } from "@/hooks";

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
  const headerService = useHeaderService();
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleLogoClick = (e: React.MouseEvent) => {
    if (navigateTo) {
      navigateTo("/", e);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        const results = await headerService.search(searchQuery);
        // In the future, this would display search results
        console.log('Search results:', results);
      } catch (error) {
        console.error('Error performing search:', error);
      }
    }
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
          <form onSubmit={handleSearch} className="relative w-full max-w-lg">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-md border bg-background pl-9 py-2 text-sm outline-none focus:ring-1 focus:ring-spark-primary dark:focus:ring-spark-dark-primary dark:border-spark-dark-neutral/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
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