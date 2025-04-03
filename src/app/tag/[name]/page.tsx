'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { services } from '@/services';
import { Button } from '@/components/ui/button';
import { Tag, Resource } from '@/lib/categorization/types';
import { ArrowLeft, BookIcon, SparklesIcon, HighlighterIcon } from 'lucide-react';

export default function TagPage() {
  const router = useRouter();
  const params = useParams();
  const name = params.name as string;
  const [tag, setTag] = useState<Tag | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTagData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get tag service
        const tagService = services.categorization.tags;
        
        // Fetch tags to find the one with matching name
        const tags = await tagService.getTags();
        
        // Try to find by name (converted to lowercase and with spaces replaced by dashes)
        const normalizedName = name.toLowerCase();
        let tagData = tags.find(t => t.name.toLowerCase() === normalizedName);
        
        // If not found by name, try to find by ID as fallback (for backward compatibility)
        if (!tagData) {
          tagData = tags.find(t => t.id === name);
        }
        
        if (!tagData) {
          setError('Tag not found');
          setLoading(false);
          return;
        }
        
        setTag(tagData);
        
        // Fetch resources for this tag
        const tagResources = await tagService.getResourcesForTag(tagData.id);
        setResources(tagResources);
      } catch (err) {
        console.error('Error loading tag data:', err);
        setError('Failed to load tag data');
      } finally {
        setLoading(false);
      }
    };
    
    loadTagData();
  }, [name]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <BookIcon className="h-4 w-4" />;
      case 'spark':
        return <SparklesIcon className="h-4 w-4" />;
      case 'highlight':
        return <HighlighterIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.type === 'book') {
      router.push(`/book/${resource.id}`);
    } else if (resource.type === 'spark') {
      router.push(`/spark/${resource.id}`);
    }
    // No direct navigation for highlights for now
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow p-6 dark:bg-neutral-800">
          <h2 className="text-xl font-semibold mb-4">Loading tag...</h2>
          <p>Loading tag details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow p-6 dark:bg-neutral-800">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Tag: {tag?.name}</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 dark:bg-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Tag Details</h2>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Name:</span> {tag?.name}
          </div>
          <div>
            <span className="font-semibold">ID:</span> {tag?.id}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 dark:bg-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Resources ({resources.length})</h2>
        {resources.length === 0 ? (
          <p>No resources have been tagged with this tag.</p>
        ) : (
          <div className="space-y-2">
            {resources.map((resource) => (
              <div 
                key={`${resource.type}-${resource.id}`}
                className="flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-700 cursor-pointer"
                onClick={() => handleResourceClick(resource)}
              >
                <div className="mr-2">
                  {getResourceIcon(resource.type)}
                </div>
                <div>
                  <span className="font-medium">{resource.id}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({resource.type})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 