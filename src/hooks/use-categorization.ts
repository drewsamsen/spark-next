'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCategorization as useCategorizationService } from '@/lib/categorization';
import { 
  Resource, 
  Category, 
  Tag, 
  CategorizationJob, 
  CategorizationResult,
  CategoryWithUsage,
  TagWithUsage
} from '@/lib/categorization/types';
import { toast } from 'react-toastify';
import { useAuthService } from './use-services';

// Interface for useCategoriesHook return value
interface UseCategoriesReturn {
  categories: Category[];
  categoriesWithUsage: CategoryWithUsage[];
  isLoading: boolean;
  error: Error | null;
  getCategoriesForResource: (resource: Resource) => Promise<Category[]>;
  addCategoryToResource: (resource: Resource, categoryId: string) => Promise<void>;
  removeCategoryFromResource: (resource: Resource, categoryId: string) => Promise<void>;
  createCategory: (name: string) => Promise<Category | null>;
}

// Interface for useTagsHook return value
interface UseTagsReturn {
  tags: Tag[];
  tagsWithUsage: TagWithUsage[];
  isLoading: boolean;
  error: Error | null;
  getTagsForResource: (resource: Resource) => Promise<Tag[]>;
  addTagToResource: (resource: Resource, tagId: string) => Promise<void>;
  removeTagFromResource: (resource: Resource, tagId: string) => Promise<void>;
  createTag: (name: string) => Promise<Tag | null>;
}

// Interface for useJobsHook return value
interface UseJobsReturn {
  jobs: CategorizationJob[];
  isLoading: boolean;
  error: Error | null;
  approveJob: (jobId: string) => Promise<void>;
  rejectJob: (jobId: string) => Promise<void>;
}

/**
 * React hook for managing categories with loading states and error handling
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesWithUsage, setCategoriesWithUsage] = useState<CategoryWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { categories: categoryService } = useCategorizationService();
  const authService = useAuthService();
  
  // Load categories on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadCategories = async (): Promise<void> => {
      try {
        setIsLoading(true);
        
        // Add debug info
        const isAuthenticated = await authService.isAuthenticated();
        console.log('useCategories - auth status:', isAuthenticated);
        
        if (!isAuthenticated) {
          console.log('useCategories - not authenticated, returning empty array');
          if (isMounted) {
            setCategories([]);
            setCategoriesWithUsage([]);
            setIsLoading(false);
          }
          return;
        }
        
        // Fetch categories
        console.log('useCategories - fetching categories');
        const data = await categoryService.getCategories();
        console.log('useCategories - raw categories data:', data);
        
        // Fetch categories with usage
        console.log('useCategories - fetching categories with usage');
        const dataWithUsage = await categoryService.getCategoriesWithUsage();
        console.log('useCategories - raw categories with usage data:', dataWithUsage);
        
        if (isMounted) {
          setCategories(data);
          setCategoriesWithUsage(dataWithUsage);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load categories'));
          setCategories([]);
          setCategoriesWithUsage([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadCategories();
    
    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange((session) => {
      console.log('useCategories - auth state changed:', !!session);
      loadCategories();
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [categoryService, authService]);
  
  // Function to get categories for a resource
  const getCategoriesForResource = useCallback(
    async (resource: Resource): Promise<Category[]> => {
      try {
        return await categoryService.getCategoriesForResource(resource);
      } catch (err) {
        console.error('Error getting categories for resource:', err);
        toast.error('Failed to load categories for this resource');
        return [];
      }
    },
    [categoryService]
  );
  
  // Function to add a category to a resource
  const addCategoryToResource = useCallback(
    async (resource: Resource, categoryId: string): Promise<void> => {
      try {
        await categoryService.addCategoryToResource(resource, categoryId);
        toast.success('Category added successfully');
      } catch (err) {
        console.error('Error adding category to resource:', err);
        toast.error('Failed to add category');
        throw err;
      }
    },
    [categoryService]
  );
  
  // Function to remove a category from a resource
  const removeCategoryFromResource = useCallback(
    async (resource: Resource, categoryId: string): Promise<void> => {
      try {
        await categoryService.removeCategoryFromResource(resource, categoryId);
        toast.success('Category removed successfully');
      } catch (err) {
        console.error('Error removing category from resource:', err);
        toast.error('Failed to remove category');
        throw err;
      }
    },
    [categoryService]
  );
  
  // Function to create a new category
  const createCategory = useCallback(
    async (name: string): Promise<Category | null> => {
      try {
        const newCategory = await categoryService.createCategory(name);
        
        // Update local state
        setCategories(prev => [...prev, newCategory]);
        
        toast.success('Category created successfully');
        return newCategory;
      } catch (err) {
        console.error('Error creating category:', err);
        toast.error('Failed to create category');
        return null;
      }
    },
    [categoryService]
  );
  
  return {
    categories,
    categoriesWithUsage,
    isLoading,
    error,
    getCategoriesForResource,
    addCategoryToResource,
    removeCategoryFromResource,
    createCategory
  };
}

/**
 * React hook for managing tags with loading states and error handling
 */
export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsWithUsage, setTagsWithUsage] = useState<TagWithUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { tags: tagService } = useCategorizationService();
  const authService = useAuthService();
  
  // Load tags on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadTags = async (): Promise<void> => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
          if (isMounted) {
            setTags([]);
            setTagsWithUsage([]);
            setIsLoading(false);
          }
          return;
        }
        
        // Fetch tags
        const data = await tagService.getTags();
        
        // Fetch tags with usage
        const dataWithUsage = await tagService.getTagsWithUsage();
        
        if (isMounted) {
          setTags(data);
          setTagsWithUsage(dataWithUsage);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading tags:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load tags'));
          setTags([]);
          setTagsWithUsage([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadTags();
    
    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange(() => {
      loadTags();
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [tagService, authService]);
  
  // Function to get tags for a resource
  const getTagsForResource = useCallback(
    async (resource: Resource): Promise<Tag[]> => {
      try {
        return await tagService.getTagsForResource(resource);
      } catch (err) {
        console.error('Error getting tags for resource:', err);
        toast.error('Failed to load tags for this resource');
        return [];
      }
    },
    [tagService]
  );
  
  // Function to add a tag to a resource
  const addTagToResource = useCallback(
    async (resource: Resource, tagId: string): Promise<void> => {
      try {
        await tagService.addTagToResource(resource, tagId);
        toast.success('Tag added successfully');
      } catch (err) {
        console.error('Error adding tag to resource:', err);
        toast.error('Failed to add tag');
        throw err;
      }
    },
    [tagService]
  );
  
  // Function to remove a tag from a resource
  const removeTagFromResource = useCallback(
    async (resource: Resource, tagId: string): Promise<void> => {
      try {
        await tagService.removeTagFromResource(resource, tagId);
        toast.success('Tag removed successfully');
      } catch (err) {
        console.error('Error removing tag from resource:', err);
        toast.error('Failed to remove tag');
        throw err;
      }
    },
    [tagService]
  );
  
  // Function to create a new tag
  const createTag = useCallback(
    async (name: string): Promise<Tag | null> => {
      try {
        const newTag = await tagService.createTag(name);
        
        // Update local state
        setTags(prev => [...prev, newTag]);
        
        toast.success('Tag created successfully');
        return newTag;
      } catch (err) {
        console.error('Error creating tag:', err);
        toast.error('Failed to create tag');
        return null;
      }
    },
    [tagService]
  );
  
  return {
    tags,
    tagsWithUsage,
    isLoading,
    error,
    getTagsForResource,
    addTagToResource,
    removeTagFromResource,
    createTag
  };
}

/**
 * React hook for managing categorization jobs with loading states and error handling
 */
export function useCategorizationJobs(): UseJobsReturn {
  const [jobs, setJobs] = useState<CategorizationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { jobs: jobService } = useCategorizationService();
  const authService = useAuthService();
  
  // Load jobs on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadJobs = async (): Promise<void> => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
          if (isMounted) {
            setJobs([]);
            setIsLoading(false);
          }
          return;
        }
        
        // Fetch jobs
        const data = await jobService.getJobs();
        
        if (isMounted) {
          setJobs(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading jobs:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load jobs'));
          setJobs([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadJobs();
    
    // Subscribe to auth state changes
    const subscription = authService.onAuthStateChange(() => {
      loadJobs();
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [jobService, authService]);
  
  // Function to approve a job
  const approveJob = useCallback(
    async (jobId: string): Promise<void> => {
      try {
        await jobService.approveJob(jobId);
        
        // Update local state - remove the approved job or mark as approved
        setJobs(prev => prev.filter(job => job.id !== jobId));
        
        toast.success('Job approved successfully');
      } catch (err) {
        console.error('Error approving job:', err);
        toast.error('Failed to approve job');
        throw err;
      }
    },
    [jobService]
  );
  
  // Function to reject a job
  const rejectJob = useCallback(
    async (jobId: string): Promise<void> => {
      try {
        await jobService.rejectJob(jobId);
        
        // Update local state - remove the rejected job
        setJobs(prev => prev.filter(job => job.id !== jobId));
        
        toast.success('Job rejected successfully');
      } catch (err) {
        console.error('Error rejecting job:', err);
        toast.error('Failed to reject job');
        throw err;
      }
    },
    [jobService]
  );
  
  return {
    jobs,
    isLoading,
    error,
    approveJob,
    rejectJob
  };
} 