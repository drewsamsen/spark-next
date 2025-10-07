'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { SidebarType, SidebarItem } from '@/lib/types';
import { EnhancedSparkItem } from '@/services';
import { useBooksService, useSparksService, useNotesService, useCategories, useTags } from '@/hooks';

interface UseSidebarDataReturn {
  items: SidebarItem[] | EnhancedSparkItem[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Unified hook for loading sidebar data based on the active sidebar type
 * Consolidates all data loading logic for different sidebar types
 */
export function useSidebarData(sidebarType: SidebarType): UseSidebarDataReturn {
  const [books, setBooks] = useState<SidebarItem[]>([]);
  const [sparks, setSparks] = useState<EnhancedSparkItem[]>([]);
  const [notes, setNotes] = useState<SidebarItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Get services
  const booksService = useBooksService();
  const sparksService = useSparksService();
  const notesService = useNotesService();
  
  // Store services in refs to avoid effect re-runs
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
  
  // Get categories and tags with their hooks (they manage their own loading)
  const { categoriesWithUsage, isLoading: loadingCategories } = useCategories();
  const { tagsWithUsage, isLoading: loadingTags } = useTags();
  
  // Transform categories to sidebar items
  const categories = useMemo(() => {
    if (!categoriesWithUsage) return [];
    return categoriesWithUsage.map((category) => ({
      id: category.id,
      name: category.name,
      highlightsCount: category.usageCount,
      date: ''
    }));
  }, [categoriesWithUsage]);
  
  // Transform tags to sidebar items
  const tags = useMemo(() => {
    if (!tagsWithUsage) return [];
    return tagsWithUsage.map((tag) => ({
      id: tag.id,
      name: tag.name,
      highlightsCount: tag.usageCount,
      date: ''
    }));
  }, [tagsWithUsage]);
  
  // Load data when sidebar type changes
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      // Don't load if no sidebar type is active
      if (!sidebarType) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        switch (sidebarType) {
          case 'highlights':
            const booksData = await servicesRef.current.books.getAll();
            if (isMounted) {
              setBooks(booksData);
            }
            break;
            
          case 'sparks':
            const sparksData = await servicesRef.current.sparks.getSparks();
            if (isMounted) {
              setSparks(sparksData);
            }
            break;
            
          case 'notes':
            const notesData = await servicesRef.current.notes.getNotes();
            if (isMounted) {
              const noteItems: SidebarItem[] = notesData.map((note) => ({
                id: note.id,
                name: note.title || 'Untitled Note',
                date: new Date(note.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: '2-digit'
                })
              }));
              setNotes(noteItems);
            }
            break;
            
          case 'categories':
          case 'tags':
            // Categories and tags are loaded by their respective hooks
            // No additional loading needed here
            break;
            
          default:
            break;
        }
      } catch (err) {
        console.error(`Failed to load ${sidebarType}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(`Failed to load ${sidebarType}`));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [sidebarType]);
  
  // Return the appropriate data based on sidebar type
  const items = useMemo(() => {
    switch (sidebarType) {
      case 'highlights':
        return books;
      case 'sparks':
        return sparks;
      case 'categories':
        return categories;
      case 'tags':
        return tags;
      case 'notes':
        return notes;
      default:
        return [];
    }
  }, [sidebarType, books, sparks, categories, tags, notes]);
  
  // Determine overall loading state
  const overallLoading = useMemo(() => {
    if (sidebarType === 'categories') return loadingCategories;
    if (sidebarType === 'tags') return loadingTags;
    return isLoading;
  }, [sidebarType, isLoading, loadingCategories, loadingTags]);
  
  return {
    items,
    isLoading: overallLoading,
    error
  };
}

