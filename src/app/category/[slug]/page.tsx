'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { services, categoryService } from '@/services';
import { Button } from '@/components/ui/button';
import { Category, Resource } from '@/lib/categorization/types';
import { ArrowLeft, BookIcon, SparklesIcon, HighlighterIcon } from 'lucide-react';

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategoryData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use imported category service
        const categories = await categoryService.getCategories();
        const categoryData = categories.find(c => c.slug === slug);
        
        if (!categoryData) {
          setError('Category not found');
          setLoading(false);
          return;
        }
        
        setCategory(categoryData);
        
        // Fetch resources for this category
        const categoryResources = await categoryService.getResourcesForCategory(categoryData.id);
        setResources(categoryResources);
      } catch (err) {
        console.error('Error loading category data:', err);
        setError('Failed to load category data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCategoryData();
  }, [slug]);

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
          <h2 className="text-xl font-semibold mb-4">Loading category...</h2>
          <p>Loading category details...</p>
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
        <h1 className="text-2xl font-bold">Category: {category?.name}</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 dark:bg-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Category Details</h2>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Name:</span> {category?.name}
          </div>
          <div>
            <span className="font-semibold">ID:</span> {category?.id}
          </div>
          <div>
            <span className="font-semibold">Slug:</span> {category?.slug}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 dark:bg-neutral-800">
        <h2 className="text-xl font-semibold mb-4">Resources ({resources.length})</h2>
        {resources.length === 0 ? (
          <p>No resources have been tagged with this category.</p>
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