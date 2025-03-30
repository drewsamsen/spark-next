'use client';

import { useState, useEffect } from "react";
import Header from "@/components/header";
import LeftSidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import MainContent from "@/components/main-content";
import NestedSidebar from "@/components/nested-sidebar";
import { Book, Sparkles } from "lucide-react";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";
import { mockApi } from "@/lib/mock-api";
import { SidebarItem } from "@/lib/mock-api/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthCheck } from "@/components/auth/AuthCheck";

export default function Dashboard() {
  const { settings } = useUISettings();
  
  // Track if component has mounted to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  // Sidebar visibility states
  const [booksSidebarOpen, setBooksSidebarOpen] = useState(false);
  const [sparksSidebarOpen, setSparksSidebarOpen] = useState(false);
  
  // Active item states
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<string | null>(null);
  const [activeSpark, setActiveSpark] = useState<string | null>(null);
  
  // Data states
  const [books, setBooks] = useState<SidebarItem[]>([]);
  const [sparks, setSparks] = useState<SidebarItem[]>([]);
  
  // Loading states
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingSparks, setLoadingSparks] = useState(false);

  // Set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Function to load books data
  const loadBooks = async () => {
    if (books.length === 0 && !loadingBooks) {
      setLoadingBooks(true);
      try {
        const data = await mockApi.getBooks();
        setBooks(data);
      } catch (error) {
        console.error("Error loading books:", error);
      } finally {
        setLoadingBooks(false);
      }
    }
  };

  // Function to load sparks data
  const loadSparks = async () => {
    if (sparks.length === 0 && !loadingSparks) {
      setLoadingSparks(true);
      try {
        const data = await mockApi.getSparks();
        setSparks(data);
      } catch (error) {
        console.error("Error loading sparks:", error);
      } finally {
        setLoadingSparks(false);
      }
    }
  };

  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const toggleRightSidebar = () => {
    setRightSidebarOpen(!rightSidebarOpen);
  };

  const toggleSidebar = (itemName: string) => {
    if (itemName === "Books") {
      // Close other sidebars if they're open
      if (sparksSidebarOpen) setSparksSidebarOpen(false);
      
      // Toggle books sidebar
      const newState = !booksSidebarOpen;
      setBooksSidebarOpen(newState);
      setActiveSidebarItem(newState ? "Books" : null);
      
      // Load data if the sidebar is opening
      if (newState) {
        loadBooks();
      }
    }
    else if (itemName === "Sparks") {
      // Close other sidebars if they're open
      if (booksSidebarOpen) setBooksSidebarOpen(false);
      
      // Toggle sparks sidebar
      const newState = !sparksSidebarOpen;
      setSparksSidebarOpen(newState);
      setActiveSidebarItem(newState ? "Sparks" : null);
      
      // Load data if the sidebar is opening
      if (newState) {
        loadSparks();
      }
    }
    else {
      // Close all sidebars for other items
      setBooksSidebarOpen(false);
      setSparksSidebarOpen(false);
      setActiveSidebarItem(itemName);
    }
  };

  // Width of icons-only part of the left sidebar when projects sidebar is open
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  // Calculate if any nested sidebar is open
  const isNestedSidebarOpen = booksSidebarOpen || sparksSidebarOpen;

  return (
    <AuthCheck>
      <TooltipProvider>
        <div className="flex h-screen flex-col">
          <Header 
            toggleLeftSidebar={toggleLeftSidebar}
            toggleRightSidebar={toggleRightSidebar}
          />
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar container */}
            {leftSidebarOpen && (
              <div className="relative h-full">
                {/* Main sidebar component handles its own width and resizing */}
                <LeftSidebar 
                  isOpen={leftSidebarOpen} 
                  setIsOpen={setLeftSidebarOpen}
                  activeSidebarItem={activeSidebarItem}
                  toggleProjectsSidebar={toggleSidebar}
                  isProjectsSidebarOpen={isNestedSidebarOpen}
                />

                {/* Books sidebar overlays on top of the left sidebar, leaving space for icons */}
                {booksSidebarOpen && (
                  <div 
                    className="absolute top-0 h-full z-10"
                    style={{ 
                      left: `${iconWidth}px`,
                      width: `${settings.leftSidebar.width - iconWidth}px`
                    }}
                  >
                    <NestedSidebar
                      isOpen={booksSidebarOpen}
                      title="Books"
                      icon={<Book className="h-5 w-5" />}
                      items={books}
                      activeItemId={activeBook}
                      setActiveItemId={setActiveBook}
                      onClose={() => setBooksSidebarOpen(false)}
                      isLoading={loadingBooks}
                    />
                  </div>
                )}
                
                {/* Sparks sidebar overlays on top of the left sidebar, leaving space for icons */}
                {sparksSidebarOpen && (
                  <div 
                    className="absolute top-0 h-full z-10"
                    style={{ 
                      left: `${iconWidth}px`,
                      width: `${settings.leftSidebar.width - iconWidth}px`
                    }}
                  >
                    <NestedSidebar
                      isOpen={sparksSidebarOpen}
                      title="Sparks"
                      icon={<Sparkles className="h-5 w-5" />}
                      items={sparks}
                      activeItemId={activeSpark}
                      setActiveItemId={setActiveSpark}
                      onClose={() => setSparksSidebarOpen(false)}
                      isLoading={loadingSparks}
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Main content area - takes remaining space */}
            <div className="flex-1 overflow-hidden">
              <MainContent />
            </div>
            
            {/* Right sidebar */}
            {rightSidebarOpen && (
              <RightSidebar 
                isOpen={rightSidebarOpen} 
                setIsOpen={setRightSidebarOpen} 
              />
            )}
          </div>
        </div>
      </TooltipProvider>
    </AuthCheck>
  );
} 