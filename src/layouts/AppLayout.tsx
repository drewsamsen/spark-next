'use client';

import { useState, useEffect, useRef } from "react";
import { Header, LeftSidebar, RightSidebar, NestedSidebar } from "@/components/Layout";
import { Book, Sparkles, FolderIcon, HashIcon, Flame, TagsIcon, Highlighter, StickyNote } from "lucide-react";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";
import { 
  SidebarItem, 
  SidebarType, 
  AppLayoutProps, 
  NestedSidebarProps,
  parseHighlightRoute,
  parseCategoryRoute,
  parseTagRoute,
  parseNoteRoute
} from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import { useBooksService, useSparksService, useCategories, useTags, useNotesService } from "@/hooks";
import { EnhancedSparkItem } from "@/services";
import { loadBooleanFromStorage, saveToStorage } from "@/lib/utils";
import { 
  getSidebarTitle, 
  getSidebarIcon, 
  getSidebarTypeFromItem, 
  shouldKeepSidebarOpen, 
  getNavigationPath 
} from "@/lib/sidebar-utils";
import { cn } from "@/lib/utils";

// Main application layout component used by all authenticated pages
export default function AppLayout({
  children,
}: AppLayoutProps) {
  const { settings } = useUISettings();
  const router = useRouter();
  const pathname = usePathname();
  
  // Get services from hooks
  const booksService = useBooksService();
  const sparksService = useSparksService();
  const notesService = useNotesService();
  const { categories: categoriesData, categoriesWithUsage, isLoading: loadingCategoriesData } = useCategories();
  const { tags: tagsData, tagsWithUsage, isLoading: loadingTagsData } = useTags();
  
  // Track if component has mounted to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  
  // Initialize state from localStorage on client-side only
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  // Focus mode state
  const [focusMode, setFocusMode] = useState(false);
  
  // Unified sidebar state - refactored from multiple boolean states
  const [nestedSidebarOpen, setNestedSidebarOpen] = useState(false);
  const [activeSidebarType, setActiveSidebarType] = useState<SidebarType>(null);
  
  // Active state - unified selected item and loading state
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Data states - keeping these separate as they represent different data models
  const [books, setBooks] = useState<SidebarItem[]>([]);
  const [sparks, setSparks] = useState<EnhancedSparkItem[]>([]);
  const [categories, setCategories] = useState<SidebarItem[]>([]);
  const [tags, setTags] = useState<SidebarItem[]>([]);
  const [notes, setNotes] = useState<SidebarItem[]>([]);

  // Track loading states using refs to prevent duplicate requests
  const isLoadingRef = useRef(false);

  // Store services in refs to avoid dependency changes
  const servicesRef = useRef({
    books: booksService,
    sparks: sparksService,
    notes: notesService
  });
  
  // Update refs when services change (but don't trigger effects)
  useEffect(() => {
    servicesRef.current = {
      books: booksService,
      sparks: sparksService,
      notes: notesService
    };
  }, [booksService, sparksService, notesService]);

  // Save sidebar states to localStorage
  useEffect(() => {
    if (hasMounted) {
      // Save main sidebar visibility states only
      saveToStorage('leftSidebarOpen', leftSidebarOpen);
      saveToStorage('rightSidebarOpen', rightSidebarOpen);
      
      // No longer persisting nested sidebar states or active selections
      // Everything except main sidebar visibility will reset on page refresh
    }
  }, [
    hasMounted, 
    leftSidebarOpen, 
    rightSidebarOpen
  ]);

  // Set hasMounted to true after the component mounts
  useEffect(() => {
    setHasMounted(true);
    
    // Load sidebar states from localStorage
    if (typeof window !== 'undefined') {
      // Load main sidebar visibility states only
      setLeftSidebarOpen(loadBooleanFromStorage('leftSidebarOpen', true));
      setRightSidebarOpen(loadBooleanFromStorage('rightSidebarOpen', true));
      
      // Not loading nested sidebar states or active selections
      // Everything starts fresh on each page load as requested
    }
  }, []);

  // Load data when sidebar type changes
  useEffect(() => {
    if (hasMounted) {
      // Fetch books data from the real database
      const loadBooks = async () => {
        setIsLoading(true);
        try {
          // Use the books service through our ref
          const data = await servicesRef.current.books.getBooks();
          setBooks(data);
        } catch (error) {
          console.error("Failed to load books:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      // Fetch sparks data
      const loadSparks = async () => {
        setIsLoading(true);
        try {
          // Use the sparks service through our ref
          const data = await servicesRef.current.sparks.getSparks();
          setSparks(data);
        } catch (error) {
          console.error("Failed to load sparks:", error);
        } finally {
          setIsLoading(false);
        }
      };

      // Fetch notes data
      const loadNotes = async () => {
        setIsLoading(true);
        try {
          // Use the notes service through our ref
          const data = await servicesRef.current.notes.getNotes();
          const noteItems: SidebarItem[] = data.map((note) => ({
            id: note.id,
            name: note.title || 'Untitled Note',
            date: new Date(note.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              year: '2-digit'
            })
          }));
          setNotes(noteItems);
        } catch (error) {
          console.error("Failed to load notes:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      // Reset active item when changing sidebar types
      setActiveItemId(null);
      
      // Load data based on active sidebar type
      if (activeSidebarType === 'highlights') {
        loadBooks();
      } else if (activeSidebarType === 'sparks') {
        loadSparks();
      } else if (activeSidebarType === 'notes') {
        loadNotes();
      } else if (activeSidebarType === 'categories') {
        // Categories are loaded via the useCategories hook
        setIsLoading(loadingCategoriesData);
      } else if (activeSidebarType === 'tags') {
        // Tags are loaded via the useTags hook
        setIsLoading(loadingTagsData);
      }
    }
  }, [hasMounted, activeSidebarType, loadingCategoriesData, loadingTagsData]);

  // Add debug logging for categories data
  useEffect(() => {
    if (activeSidebarType === 'categories') {
      console.log('Categories hook data:', categoriesData);
    }
  }, [categoriesData, activeSidebarType]);

  // Handle categories data changes
  useEffect(() => {
    if (hasMounted && categoriesWithUsage) {
      console.log('Processing categories with usage data, length:', categoriesWithUsage.length);
      
      // Even if empty, still set an empty array to avoid undefined
      const categoryItems: SidebarItem[] = categoriesWithUsage.map((category) => ({
        id: category.id,
        name: category.name,
        highlightsCount: category.usageCount,
        date: ''
      }));
      
      console.log('Mapped categories to sidebar items with usage counts:', categoryItems);
      setCategories(categoryItems);
    }
  }, [hasMounted, categoriesWithUsage]);

  // Handle tags data changes
  useEffect(() => {
    if (hasMounted && tagsWithUsage) {
      console.log('Processing tags with usage data, length:', tagsWithUsage.length);
      
      // Even if empty, still set an empty array to avoid undefined
      const tagItems: SidebarItem[] = tagsWithUsage.map((tag) => ({
        id: tag.id,
        name: tag.name,
        highlightsCount: tag.usageCount,
        date: ''
      }));
      
      console.log('Mapped tags to sidebar items with usage counts:', tagItems);
      setTags(tagItems);
    }
  }, [hasMounted, tagsWithUsage]);

  // Toggle left sidebar visibility
  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };
  
  // Toggle right sidebar visibility
  const toggleRightSidebar = () => {
    setRightSidebarOpen(!rightSidebarOpen);
  };

  // Toggle focus mode function
  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    if (!focusMode) {
      // Entering focus mode - hide sidebars
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    } else {
      // Exiting focus mode - restore sidebars
      setLeftSidebarOpen(true);
      setRightSidebarOpen(true);
    }
  };

  // Client-side navigation function
  const navigateTo = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    // Close any open nested sidebars when navigating to pages that aren't related to them
    if (nestedSidebarOpen && activeSidebarType) {
      // Check if path is related to current sidebar type
      const shouldCloseSidebar = !shouldKeepSidebarOpen(activeSidebarType, path);
      
      if (shouldCloseSidebar) {
        setNestedSidebarOpen(false);
        setActiveSidebarType(null);
      }
    }
    
    router.push(path);
  };

  // Toggle nested sidebar visibility based on the clicked item
  const toggleSidebar = (item: string) => {
    // Map menu item names to sidebar types
    const sidebarType = getSidebarTypeFromItem(item);
    
    // If the current sidebar is already open, close it
    if (nestedSidebarOpen && activeSidebarType === sidebarType) {
      setNestedSidebarOpen(false);
      setActiveSidebarType(null);
      setActiveSidebarItem(null);
    } else if (sidebarType) {
      // Close current sidebar and open the requested one
      setNestedSidebarOpen(true);
      setActiveSidebarType(sidebarType);
      setActiveSidebarItem(item);
    } else {
      // For other items without nested sidebars
      // Close any open nested sidebar
      setNestedSidebarOpen(false);
      setActiveSidebarType(null);
      
      // Set the active item
      setActiveSidebarItem(activeSidebarItem === item ? null : item);
    }
  };

  // Unified item selection handler
  const handleItemSelect = (itemId: string, extraData?: any) => {
    setActiveItemId(itemId);
    
    if (activeSidebarType) {
      // Get the navigation path using the utility function
      const path = getNavigationPath(
        activeSidebarType,
        itemId,
        getSidebarItems(activeSidebarType),
        categoriesData,
        extraData
      );
      
      if (path) {
        router.push(path);
      }
    }
  };

  const getSidebarItems = (type: SidebarType) => {
    switch (type) {
      case 'highlights': return books;
      case 'sparks': return sparks;
      case 'categories': return categories;
      case 'tags': return tags;
      case 'notes': return notes;
      default: return [];
    }
  };

  // Width of icons-only part of the left sidebar when projects sidebar is open
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <div className="flex h-screen flex-col">
        <Header 
          toggleRightSidebar={toggleRightSidebar}
          navigateTo={navigateTo}
          currentPath={pathname}
          isFocusMode={focusMode}
          toggleFocusMode={toggleFocusMode}
        />
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar container - use CSS to hide/show instead of removing from DOM */}
          <div className={cn(
            "relative h-full transition-none",
            !leftSidebarOpen && "hidden"
          )}>
            {/* Main sidebar component handles its own width and resizing */}
            <LeftSidebar 
              isOpen={leftSidebarOpen} 
              setIsOpen={setLeftSidebarOpen}
              activeSidebarItem={activeSidebarItem}
              toggleProjectsSidebar={toggleSidebar}
              isProjectsSidebarOpen={nestedSidebarOpen}
              navigateTo={navigateTo}
              currentPath={pathname}
            />

            {/* Nested sidebar - only rendered when needed with dynamic content */}
            {nestedSidebarOpen && activeSidebarType && (
              <div 
                className="absolute top-0 h-full z-[25]"
                style={{ 
                  left: `${iconWidth}px`
                }}
              >
                <NestedSidebar
                  key={`nested-sidebar-${activeSidebarType}`}
                  isOpen={nestedSidebarOpen}
                  title={getSidebarTitle(activeSidebarType)}
                  icon={getSidebarIcon(activeSidebarType)}
                  items={getSidebarItems(activeSidebarType)}
                  activeItemId={activeItemId}
                  setActiveItemId={handleItemSelect}
                  onClose={() => {
                    setNestedSidebarOpen(false);
                    setActiveSidebarType(null);
                  }}
                  isLoading={isLoading}
                  instanceId={`sidebar-instance-${activeSidebarType}`}
                />
              </div>
            )}
          </div>
          
          {/* Main content area */}
          <main className={cn(
            "flex-1 overflow-auto transition-none",
            focusMode && "flex justify-center" // Center content in focus mode
          )}>
            <div 
              className="w-full transition-none"
              style={focusMode ? { maxWidth: '1200px', padding: '0 1rem' } : {}}
            >
              {children}
            </div>
          </main>
          
          {/* Right sidebar - use CSS to hide/show instead of removing from DOM */}
          <div className={cn(
            "transition-none", 
            !rightSidebarOpen && "hidden"
          )}>
            <RightSidebar 
              isOpen={rightSidebarOpen} 
              setIsOpen={setRightSidebarOpen}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 