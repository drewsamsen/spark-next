'use client';

import { useState } from 'react';
import { useSparks, useCategories, useResourceHelper } from '@/hooks';

/**
 * Example component that demonstrates using multiple enhanced hooks together
 * Shows a list of sparks, allows filtering by category, and provides
 * functionality to add categories to sparks
 */
export function CategorizedSparks() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Use our enhanced hooks with loading states
  const { 
    sparks, 
    isLoading: sparksLoading, 
    error: sparksError 
  } = useSparks();
  
  const { 
    categories, 
    isLoading: categoriesLoading, 
    error: categoriesError,
    getCategoriesForResource,
    addCategoryToResource 
  } = useCategories();
  
  const { createSparkResource } = useResourceHelper();
  
  // Track which sparks have their categories expanded
  const [expandedSparkIds, setExpandedSparkIds] = useState<Set<string>>(new Set());
  
  // Track sparks that are currently loading their categories
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());
  
  // Loading state for the entire component
  const isLoading = sparksLoading || categoriesLoading;
  
  // Error handling
  const error = sparksError || categoriesError;
  if (error) {
    return <div className="error-container">Error: {error.message}</div>;
  }
  
  // Toggle expanded state for a spark
  const toggleExpandSpark = async (sparkId: string) => {
    const newExpandedIds = new Set(expandedSparkIds);
    
    if (newExpandedIds.has(sparkId)) {
      newExpandedIds.delete(sparkId);
    } else {
      newExpandedIds.add(sparkId);
      
      // Load categories for this spark if we're expanding it
      if (!loadingCategories.has(sparkId)) {
        setLoadingCategories(prev => new Set(prev).add(sparkId));
        
        try {
          // Use the resource helper to create a spark resource
          const sparkResource = createSparkResource(sparkId);
          
          // Fetch categories for this spark
          await getCategoriesForResource(sparkResource);
        } catch (error) {
          console.error('Failed to load categories for spark:', error);
        } finally {
          setLoadingCategories(prev => {
            const updated = new Set(prev);
            updated.delete(sparkId);
            return updated;
          });
        }
      }
    }
    
    setExpandedSparkIds(newExpandedIds);
  };
  
  // Add a category to a spark
  const handleAddCategory = async (sparkId: string, categoryId: string) => {
    try {
      const sparkResource = createSparkResource(sparkId);
      await addCategoryToResource(sparkResource, categoryId);
    } catch (error) {
      console.error('Failed to add category to spark:', error);
    }
  };
  
  // Filter sparks by selected category (if any)
  const filteredSparks = selectedCategoryId 
    ? sparks.filter(spark => {
        // This would require implementing a method to check if a spark has a category
        // In a real implementation, we'd either:
        // 1. Store categories with each spark when we load them
        // 2. Make a separate lookup to check category membership
        return true; // Placeholder - in real implementation we'd check category membership
      })
    : sparks;
  
  return (
    <div className="categorized-sparks-container">
      <h1>Sparks</h1>
      
      {/* Loading state */}
      {isLoading ? (
        <div className="loading">Loading sparks and categories...</div>
      ) : (
        <>
          {/* Categories filter */}
          <div className="categories-filter">
            <h2>Filter by Category</h2>
            <div className="category-buttons">
              <button 
                className={selectedCategoryId === null ? 'active' : ''} 
                onClick={() => setSelectedCategoryId(null)}
              >
                All Sparks
              </button>
              
              {categories.map(category => (
                <button 
                  key={category.id}
                  className={selectedCategoryId === category.id ? 'active' : ''}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sparks list */}
          <div className="sparks-list">
            {filteredSparks.length === 0 ? (
              <div className="no-sparks">No sparks found.</div>
            ) : (
              filteredSparks.map(spark => (
                <div key={spark.id} className="spark-item">
                  <h3>{spark.title}</h3>
                  <p>{spark.content}</p>
                  
                  <button onClick={() => toggleExpandSpark(spark.id)}>
                    {expandedSparkIds.has(spark.id) ? 'Hide Categories' : 'Show Categories'}
                  </button>
                  
                  {/* Categories for this spark */}
                  {expandedSparkIds.has(spark.id) && (
                    <div className="spark-categories">
                      {loadingCategories.has(spark.id) ? (
                        <div>Loading categories...</div>
                      ) : (
                        <>
                          <h4>Add Category</h4>
                          <div className="add-category-buttons">
                            {categories.map(category => (
                              <button 
                                key={category.id}
                                onClick={() => handleAddCategory(spark.id, category.id)}
                              >
                                {category.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
} 