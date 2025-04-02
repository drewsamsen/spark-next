import { useState, useEffect } from 'react';
import { contentService, QuickAccessItem, ActivityItem, DocumentItem } from '@/services/content.service';
import { useAuthSession } from '@/hooks/use-auth-session';

/**
 * Hook for accessing content service functionality
 */
export function useContentService() {
  const { session } = useAuthSession();
  const userId = session?.user?.id;
  
  const [quickAccessItems, setQuickAccessItems] = useState<QuickAccessItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [documentItems, setDocumentItems] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data when the component mounts or user changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // In the future, these will be async calls to the service
        // that fetches data from the repository
        const quickAccess = contentService.getQuickAccessItems();
        const activities = contentService.getRecentActivities();
        const documents = contentService.getRecentDocuments();
        
        setQuickAccessItems(quickAccess);
        setActivityItems(activities);
        setDocumentItems(documents);
      } catch (error) {
        console.error('Error loading content data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userId]);
  
  return {
    quickAccessItems,
    activityItems,
    documentItems,
    isLoading
  };
} 