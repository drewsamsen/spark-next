'use client';

import { useState, useEffect } from "react";
import Header from "@/components/header";
import LeftSidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import NestedSidebar from "@/components/nested-sidebar";
import { Book, Sparkles } from "lucide-react";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";
import { mockApi } from "@/lib/mock-api";
import { SidebarItem } from "@/lib/mock-api/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";

// Dashboard layout component to be used by all app pages
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useUISettings();
  const router = useRouter();
  const pathname = usePathname();
  
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

  useEffect(() => {
    if (hasMounted) {
      // Fetch books data
      const loadBooks = async () => {
        setLoadingBooks(true);
        try {
          const data = await mockApi.getBooks();
          setBooks(data);
        } catch (error) {
          console.error("Failed to load books:", error);
        } finally {
          setLoadingBooks(false);
        }
      };
      
      // Fetch sparks data
      const loadSparks = async () => {
        setLoadingSparks(true);
        try {
          const data = await mockApi.getSparks();
          setSparks(data);
        } catch (error) {
          console.error("Failed to load sparks:", error);
        } finally {
          setLoadingSparks(false);
        }
      };
      
      // Load data for any active sidebar
      if (booksSidebarOpen) {
        loadBooks();
      }
      
      if (sparksSidebarOpen) {
        loadSparks();
      }
    }
  }, [hasMounted, booksSidebarOpen, sparksSidebarOpen]);

  // Toggle left sidebar visibility
  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };
  
  // Toggle right sidebar visibility
  const toggleRightSidebar = () => {
    setRightSidebarOpen(!rightSidebarOpen);
  };

  // Client-side navigation function
  const navigateTo = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
  };

  // Toggle nested sidebar visibility based on the clicked item
  const toggleSidebar = (item: string) => {
    if (item === "Books") {
      // If already open, close it
      if (booksSidebarOpen) {
        setBooksSidebarOpen(false);
        setActiveSidebarItem(null);
      } else {
        // Close any other open sidebar first
        setSparksSidebarOpen(false);
        // Then open Books sidebar
        setBooksSidebarOpen(true);
        setActiveSidebarItem("Books");
      }
    } else if (item === "Sparks") {
      // If already open, close it
      if (sparksSidebarOpen) {
        setSparksSidebarOpen(false);
        setActiveSidebarItem(null);
      } else {
        // Close any other open sidebar first
        setBooksSidebarOpen(false);
        // Then open Sparks sidebar
        setSparksSidebarOpen(true);
        setActiveSidebarItem("Sparks");
      }
    } else if (item === "Settings") {
      // Just set this as active - later we'll implement settings
      setActiveSidebarItem(activeSidebarItem === "Settings" ? null : "Settings");
    } else {
      // For other items without nested sidebars
      setActiveSidebarItem(activeSidebarItem === item ? null : item);
    }
  };

  // Width of icons-only part of the left sidebar when projects sidebar is open
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  // Calculate if any nested sidebar is open
  const isNestedSidebarOpen = booksSidebarOpen || sparksSidebarOpen;

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <div className="flex h-screen flex-col">
        <Header 
          toggleLeftSidebar={toggleLeftSidebar}
          toggleRightSidebar={toggleRightSidebar}
          navigateTo={navigateTo}
          currentPath={pathname}
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
                navigateTo={navigateTo}
                currentPath={pathname}
              />

              {/* Books sidebar overlays on top of the left sidebar, leaving space for icons */}
              {booksSidebarOpen && (
                <div 
                  className="absolute top-0 h-full z-[25]"
                  style={{ 
                    left: `${iconWidth}px`
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
                  className="absolute top-0 h-full z-[25]"
                  style={{ 
                    left: `${iconWidth}px`
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
            {children}
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
  );
} 