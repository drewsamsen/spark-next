'use client';

import { useState, useRef, useEffect } from "react";
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

export default function Dashboard() {
  const { settings, updateLeftSidebarWidth } = useUISettings();
  
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
  
  // Left sidebar resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(settings.leftSidebar.width);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Update local state when settings change (but not during resize)
  useEffect(() => {
    if (hasMounted && !isResizing) {
      setSidebarWidth(settings.leftSidebar.width);
    }
  }, [hasMounted, settings.leftSidebar.width, isResizing]);

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

  // Handle resize for left sidebar
  useEffect(() => {
    if (!resizeHandleRef.current) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Get the new width based on mouse position
      const newWidth = e.clientX;
      
      // Apply constraints
      if (newWidth >= UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH && 
          newWidth <= UI_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate the final width directly to avoid stale state
        const finalWidth = e.clientX;
        // Apply constraints to ensure valid width
        const validWidth = Math.max(
          UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH,
          Math.min(finalWidth, UI_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH)
        );
        // First update local state
        setSidebarWidth(validWidth);
        // Then save to localStorage
        updateLeftSidebarWidth(validWidth);
      }
      setIsResizing(false);
    };

    const resizeHandle = resizeHandleRef.current;
    resizeHandle.addEventListener('mousedown', handleMouseDown);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, updateLeftSidebarWidth]);

  // Width of icons-only part of the left sidebar when projects sidebar is open
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  // Use default width during server rendering and before mounting to prevent hydration mismatch
  const displayWidth = hasMounted ? sidebarWidth : UI_SETTINGS.LEFT_SIDEBAR.DEFAULT_WIDTH;

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col">
        <Header 
          toggleLeftSidebar={toggleLeftSidebar}
          toggleRightSidebar={toggleRightSidebar}
        />
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar container with fixed width */}
          <div 
            className="relative h-full" 
            style={{ 
              width: leftSidebarOpen ? `${displayWidth}px` : '0px',
              minWidth: leftSidebarOpen ? `${displayWidth}px` : '0px',
              transition: isResizing ? 'none' : 'width 300ms ease-in-out, min-width 300ms ease-in-out'
            }}
          >
            {/* Main sidebar - always full width */}
            <LeftSidebar 
              isOpen={leftSidebarOpen} 
              setIsOpen={setLeftSidebarOpen}
              activeSidebarItem={activeSidebarItem}
              toggleProjectsSidebar={toggleSidebar}
              isProjectsSidebarOpen={booksSidebarOpen || sparksSidebarOpen}
            />

            {/* Books sidebar overlays on top of the left sidebar, leaving space for icons */}
            {booksSidebarOpen && (
              <div 
                className="absolute top-0 h-full z-10"
                style={{ 
                  left: `${iconWidth}px`,
                  width: `${displayWidth - iconWidth}px`
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
                  width: `${displayWidth - iconWidth}px`
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
            
            {/* Resize handle for the left sidebar */}
            <div
              ref={resizeHandleRef}
              className="absolute top-0 right-0 h-full w-1 bg-transparent cursor-ew-resize hover:bg-border z-20"
            >
              <div className="absolute top-1/2 right-0 h-8 w-1 bg-border rounded opacity-0 hover:opacity-100" />
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 overflow-hidden">
            <MainContent />
          </div>
          
          {/* Right sidebar */}
          <RightSidebar 
            isOpen={rightSidebarOpen}
            setIsOpen={setRightSidebarOpen}
          />
        </div>
      </div>
    </TooltipProvider>
  );
} 