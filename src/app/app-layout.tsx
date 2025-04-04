'use client';

import { useState, useEffect, useRef } from "react";
import { Header, LeftSidebar, RightSidebar, NestedSidebar } from "@/components/Layout";
import { Book, Sparkles, FolderIcon, HashIcon, Flame, TagsIcon, Highlighter, StickyNote } from "lucide-react";
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";
import { SidebarItem } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRouter, usePathname } from "next/navigation";
import { useBooksService, useSparksService, useCategories, useTags, useNotesService } from "@/hooks";
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

// Main application layout component used by all authenticated pages
export default function AppLayout({
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
  const notesService = useNotesService();
  const { categories: categoriesData, categoriesWithUsage, isLoading: loadingCategoriesData } = useCategories();
  const { tags: tagsData, tagsWithUsage, isLoading: loadingTagsData } = useTags();
  
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
  const [notesSidebarOpen, setNotesSidebarOpen] = useState(false);
  
  // Active item states
  const [activeSidebarItem, setActiveSidebarItem] = useState<string | null>(null);
  const [activeBook, setActiveBook] = useState<string | null>(null);
  const [activeSpark, setActiveSpark] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  
  // Data states
  const [books, setBooks] = useState<SidebarItem[]>([]);
  const [sparks, setSparks] = useState<EnhancedSparkItem[]>([]);
  const [categories, setCategories] = useState<SidebarItem[]>([]);
  const [tags, setTags] = useState<SidebarItem[]>([]);
  const [notes, setNotes] = useState<SidebarItem[]>([]);
  
  // Loading states
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [loadingSparks, setLoadingSparks] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Track loading states using refs to prevent duplicate requests
  const isLoadingNotesRef = useRef(false);

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
          // Use the books service through our ref
          const data = await servicesRef.current.books.getBooks();
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
          // Use the sparks service through our ref
          const data = await servicesRef.current.sparks.getSparks();
          setSparks(data);
        } catch (error) {
          console.error("Failed to load sparks:", error);
        } finally {
          setLoadingSparks(false);
        }
      };

      // Fetch notes data
      const loadNotes = async () => {
        setLoadingNotes(true);
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
          setLoadingNotes(false);
        }
      };
      
      // Load data for any active sidebar
      if (booksSidebarOpen) {
        loadBooks();
      }
      
      if (sparksSidebarOpen) {
        loadSparks();
      }

      if (notesSidebarOpen) {
        loadNotes();
      }
    }
  }, [hasMounted, booksSidebarOpen, sparksSidebarOpen, notesSidebarOpen]);

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
      setLoadingTags(loadingTagsData);
    }
  }, [hasMounted, tagsWithUsage, loadingTagsData]);

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
    if (booksSidebarOpen && !path.includes("/highlights/")) {
      setBooksSidebarOpen(false);
    }
    if (sparksSidebarOpen && !path.includes("/spark/")) {
      setSparksSidebarOpen(false);
    }
    
    router.push(path);
  };

  // Toggle nested sidebar visibility based on the clicked item
  const toggleSidebar = (item: string) => {
    if (item === "Highlights") {
      // If already open, close it
      if (booksSidebarOpen) {
        setBooksSidebarOpen(false);
        setActiveSidebarItem(null);
      } else {
        // Close any other open sidebar first
        setSparksSidebarOpen(false);
        setCategoriesSidebarOpen(false);
        setTagsSidebarOpen(false);
        setNotesSidebarOpen(false);
        // Then open Books sidebar
        setBooksSidebarOpen(true);
        setActiveSidebarItem("Highlights");
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
        setNotesSidebarOpen(false);
        // Then open Sparks sidebar
        setSparksSidebarOpen(true);
        setActiveSidebarItem("Sparks");
      }
    } else if (item === "Notes") {
      // If already open, close it
      if (notesSidebarOpen) {
        setNotesSidebarOpen(false);
        setActiveSidebarItem(null);
      } else {
        // Close any other open sidebar first
        setBooksSidebarOpen(false);
        setSparksSidebarOpen(false);
        setCategoriesSidebarOpen(false);
        setTagsSidebarOpen(false);
        // Then open Notes sidebar
        setNotesSidebarOpen(true);
        setActiveSidebarItem("Notes");
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
        setNotesSidebarOpen(false);
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
        setNotesSidebarOpen(false);
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
      if (notesSidebarOpen) setNotesSidebarOpen(false);
      
      // Set the active item
      setActiveSidebarItem(activeSidebarItem === item ? null : item);
    }
  };

  // Handle book selection
  const handleBookSelect = (bookId: string, rwId?: number) => {
    setActiveBook(bookId); // Still set activeBook to the UUID for sidebar highlighting
    
    // If rwId is directly provided, use it for navigation
    if (rwId) {
      router.push(`/highlights/${rwId}`);
      return;
    }
    
    // Fallback: find the selected book to get its rwId
    const selectedBook = books.find(book => book.id === bookId);
    
    if (selectedBook && selectedBook.rwId) {
      // Navigate using the Readwise ID
      router.push(`/highlights/${selectedBook.rwId}`);
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
    
    // Find the category to get its slug using categoriesData (which contains the slug)
    // instead of the SidebarItem array which doesn't have the slug property
    const selectedCategory = categoriesData.find(category => category.id === categoryId);
    if (selectedCategory) {
      // Navigate to the category details page using slug
      router.push(`/category/${selectedCategory.slug}`);
    } else {
      // Log error if category not found
      console.error(`Category with ID ${categoryId} not found`);
    }
  };

  // Handle tag selection
  const handleTagSelect = (tagId: string) => {
    setActiveTag(tagId);
    
    // Find the tag to get its name
    const selectedTag = tags.find(tag => tag.id === tagId);
    if (selectedTag) {
      // Use the tag name in the URL instead of the ID
      // The tag name is already standardized (lowercase with dashes)
      router.push(`/tag/${selectedTag.name}`);
    } else {
      // Fallback to ID if tag not found
      router.push(`/tag/${tagId}`);
    }
  };

  // Handle note selection
  const handleNoteSelect = (noteId: string) => {
    setActiveNote(noteId);
    router.push(`/notes/${noteId}`);
  };

  // Width of icons-only part of the left sidebar when projects sidebar is open
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  // Calculate if any nested sidebar is open
  const isNestedSidebarOpen = booksSidebarOpen || sparksSidebarOpen || categoriesSidebarOpen || tagsSidebarOpen || notesSidebarOpen;

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

              {/* Highlights sidebar */}
              {booksSidebarOpen && (
                <div 
                  className="absolute top-0 h-full z-[25]"
                  style={{ 
                    left: `${iconWidth}px`
                  }}
                >
                  <NestedSidebar
                    isOpen={booksSidebarOpen}
                    title="Highlights"
                    icon={<Highlighter className="h-5 w-5" />}
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
                    icon={<Flame className="h-5 w-5" />}
                    items={sparks}
                    activeItemId={activeSpark}
                    setActiveItemId={handleSparkSelect}
                    onClose={() => setSparksSidebarOpen(false)}
                    isLoading={loadingSparks}
                  />
                </div>
              )}
              
              {/* Notes sidebar */}
              {notesSidebarOpen && (
                <div 
                  className="absolute top-0 h-full z-[25]"
                  style={{ 
                    left: `${iconWidth}px`
                  }}
                >
                  <NestedSidebar
                    isOpen={notesSidebarOpen}
                    title="Notes"
                    icon={<StickyNote className="h-5 w-5" />}
                    items={notes}
                    activeItemId={activeNote}
                    setActiveItemId={handleNoteSelect}
                    onClose={() => setNotesSidebarOpen(false)}
                    isLoading={loadingNotes}
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
                    icon={<TagsIcon className="h-5 w-5" />}
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