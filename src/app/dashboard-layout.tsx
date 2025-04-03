'use client';

import { useState, useEffect } from "react";
import Header from "@/components/header";
import LeftSidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import NestedSidebar from "@/components/nested-sidebar";
import { Book, Sparkles, FolderIcon, HashIcon } from "lucide-react";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";
import { SidebarItem } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import { useBooksService, useSparksService, useCategories, useTags } from "@/hooks";
import { EnhancedSparkItem } from "@/services";

/**
 * Load a boolean value from localStorage with fallback
 */
function loadBooleanFromStorage(key: string, defaultValue: boolean): boolean {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) {
      return value === 'true';
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

/**
 * Load a string value from localStorage with fallback
 */
function loadStringFromStorage(key: string, defaultValue: string | null): string | null {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) {
      return value;
    }
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
  }
  return defaultValue;
}

// Dashboard layout component to be used by all app pages
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useUISettings();
  const router = useRouter();
  const pathname = usePathname();
  
  // Get services from hooks
  const booksService = useBooksService();
  const sparksService = useSparksService();
  const { categories: categoriesData, categoriesWithUsage, isLoading: loadingCategoriesData } = useCategories();
  const { tags: tagsData, isLoading: loadingTagsData } = useTags();
  
  // Track if component has mounted to prevent hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);
  
  // Initialize state from localStorage on client-side only
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  
  // Sidebar visibility states
  const [booksSidebarOpen, setBooksSidebarOpen] = useState(false);
  const [sparksSidebarOpen, setSparksSidebarOpen] = useState(false);
  const [categoriesSidebarOpen, setCategoriesSidebarOpen] = useState(false);
  const [tagsSidebarOpen, setTagsSidebarOpen] = useState(false);
  
  // Active item states
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<string | null>(null);
  const [activeSpark, setActiveSpark] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  // Data states
  const [books, setBooks] = useState<SidebarItem[]>([]);
  const [sparks, setSparks] = useState<EnhancedSparkItem[]>([]);
  const [categories, setCategories] = useState<SidebarItem[]>([]);
  const [tags, setTags] = useState<SidebarItem[]>([]);
  
  // Loading states
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingSparks, setLoadingSparks] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // Save sidebar states to localStorage
  useEffect(() => {
    if (hasMounted) {
      // Save main sidebar visibility states only
      localStorage.setItem('leftSidebarOpen', leftSidebarOpen.toString());
      localStorage.setItem('rightSidebarOpen', rightSidebarOpen.toString());
      
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

  useEffect(() => {
    if (hasMounted) {
      // Fetch books data from the real database
      const loadBooks = async () => {
        setLoadingBooks(true);
        try {
          // Use the books service through our hook
          const data = await booksService.getBooks();
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
          // Use the sparks service through our hook
          const data = await sparksService.getSparks();
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
  }, [hasMounted, booksSidebarOpen, sparksSidebarOpen, booksService, sparksService]);

  // Add debug logging for categories data
  useEffect(() => {
    if (categoriesSidebarOpen) {
      console.log('Categories hook data:', categoriesData);
    }
  }, [categoriesData, categoriesSidebarOpen]);

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
      setLoadingCategories(loadingCategoriesData);
    }
  }, [hasMounted, categoriesWithUsage, loadingCategoriesData]);

  // Handle tags data changes
  useEffect(() => {
    if (hasMounted && tagsData) {
      console.log('Processing tags data, length:', tagsData.length);
      
      // Even if empty, still set an empty array to avoid undefined
      const tagItems: SidebarItem[] = tagsData.map((tag) => ({
        id: tag.id,
        name: tag.name,
        date: '' // Tags don't have a slug, so use empty string as date
      }));
      
      console.log('Mapped tags to sidebar items:', tagItems);
      setTags(tagItems);
      setLoadingTags(loadingTagsData);
    }
  }, [hasMounted, tagsData, loadingTagsData]);

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
    
    // Close any open nested sidebars when navigating to pages that aren't related to them
    // This ensures nested sidebars close when clicking things like Settings
    if (booksSidebarOpen && !path.includes("/book/")) {
      setBooksSidebarOpen(false);
    }
    if (sparksSidebarOpen && !path.includes("/spark/")) {
      setSparksSidebarOpen(false);
    }
    
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
        setCategoriesSidebarOpen(false);
        setTagsSidebarOpen(false);
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
        setCategoriesSidebarOpen(false);
        setTagsSidebarOpen(false);
        // Then open Sparks sidebar
        setSparksSidebarOpen(true);
        setActiveSidebarItem("Sparks");
      }
    } else if (item === "Categories") {
      // If already open, close it
      if (categoriesSidebarOpen) {
        setCategoriesSidebarOpen(false);
        setActiveSidebarItem(null);
      } else {
        // Close any other open sidebar first
        setBooksSidebarOpen(false);
        setSparksSidebarOpen(false);
        setTagsSidebarOpen(false);
        // Then open Categories sidebar
        setCategoriesSidebarOpen(true);
        setActiveSidebarItem("Categories");
      }
    } else if (item === "Tags") {
      // If already open, close it
      if (tagsSidebarOpen) {
        setTagsSidebarOpen(false);
        setActiveSidebarItem(null);
      } else {
        // Close any other open sidebar first
        setBooksSidebarOpen(false);
        setSparksSidebarOpen(false);
        setCategoriesSidebarOpen(false);
        // Then open Tags sidebar
        setTagsSidebarOpen(true);
        setActiveSidebarItem("Tags");
      }
    } else {
      // For other items without nested sidebars
      // Close any open nested sidebars
      if (booksSidebarOpen) setBooksSidebarOpen(false);
      if (sparksSidebarOpen) setSparksSidebarOpen(false);
      if (categoriesSidebarOpen) setCategoriesSidebarOpen(false);
      if (tagsSidebarOpen) setTagsSidebarOpen(false);
      
      // Set the active item
      setActiveSidebarItem(activeSidebarItem === item ? null : item);
    }
  };

  // Handle book selection
  const handleBookSelect = (bookId: string, rwId?: number) => {
    setActiveBook(bookId); // Still set activeBook to the UUID for sidebar highlighting
    
    // If rwId is directly provided, use it for navigation
    if (rwId) {
      router.push(`/dashboard/book/${rwId}`);
      return;
    }
    
    // Fallback: find the selected book to get its rwId
    const selectedBook = books.find(book => book.id === bookId);
    
    if (selectedBook && selectedBook.rwId) {
      // Navigate using the Readwise ID
      router.push(`/dashboard/book/${selectedBook.rwId}`);
    }
  };

  // Update setActiveSpark to handle the rwId parameter
  const handleSparkSelect = (sparkId: string, rwId?: number) => {
    setActiveSpark(sparkId);
    // Additional navigation logic for sparks can be added here
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    // Navigate to the category details page
    router.push(`/dashboard/category/${categoryId}`);
  };

  // Handle tag selection
  const handleTagSelect = (tagId: string) => {
    setActiveTag(tagId);
    // Navigate to the tag details page
    router.push(`/dashboard/tag/${tagId}`);
  };

  // Width of icons-only part of the left sidebar when projects sidebar is open
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  // Calculate if any nested sidebar is open
  const isNestedSidebarOpen = booksSidebarOpen || sparksSidebarOpen || categoriesSidebarOpen || tagsSidebarOpen;

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <div className="flex h-screen flex-col">
        <Header 
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

              {/* Books sidebar */}
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
                    setActiveItemId={handleBookSelect}
                    onClose={() => setBooksSidebarOpen(false)}
                    isLoading={loadingBooks}
                  />
                </div>
              )}
              
              {/* Sparks sidebar */}
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
                    setActiveItemId={handleSparkSelect}
                    onClose={() => setSparksSidebarOpen(false)}
                    isLoading={loadingSparks}
                  />
                </div>
              )}
              
              {/* Categories sidebar */}
              {categoriesSidebarOpen && (
                <div 
                  className="absolute top-0 h-full z-[25]"
                  style={{ 
                    left: `${iconWidth}px`
                  }}
                >
                  <NestedSidebar
                    isOpen={categoriesSidebarOpen}
                    title="Categories"
                    icon={<FolderIcon className="h-5 w-5" />}
                    items={categories}
                    activeItemId={activeCategory}
                    setActiveItemId={handleCategorySelect}
                    onClose={() => setCategoriesSidebarOpen(false)}
                    isLoading={loadingCategories}
                  />
                </div>
              )}
              
              {/* Tags sidebar */}
              {tagsSidebarOpen && (
                <div 
                  className="absolute top-0 h-full z-[25]"
                  style={{ 
                    left: `${iconWidth}px`
                  }}
                >
                  <NestedSidebar
                    isOpen={tagsSidebarOpen}
                    title="Tags"
                    icon={<HashIcon className="h-5 w-5" />}
                    items={tags}
                    activeItemId={activeTag}
                    setActiveItemId={handleTagSelect}
                    onClose={() => setTagsSidebarOpen(false)}
                    isLoading={loadingTags}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          
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