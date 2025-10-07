# React Hooks Usage Guide

This guide provides examples of how to use the custom React hooks in the Spark application.

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Hooks](#basic-hooks)
3. [Advanced Hooks](#advanced-hooks)
4. [Categorization Hooks](#categorization-hooks)
5. [Complete Example: Combining Multiple Hooks](#complete-example-combining-multiple-hooks)
6. [Best Practices](#best-practices)

## Introduction

Spark uses a repository-service-hook pattern for data access. This guide explains how to use the hooks in your components.

## Basic Hooks

### useAuthService

```tsx
import { useAuthService } from '@/hooks';

function LoginButton() {
  const authService = useAuthService();

  const handleLogin = async () => {
    try {
      await authService.signInWithEmail('user@example.com', 'password');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return <button onClick={handleLogin}>Log In</button>;
}
```

### useAuthSession

```tsx
import { useAuthSession } from '@/hooks';

function UserProfile() {
  const { session, isLoading, error } = useAuthSession();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!session) return <div>Not logged in</div>;

  return <div>Welcome, {session.user.email}</div>;
}
```

## Advanced Hooks

### useUserSettings

The `useUserSettings` hook provides access to user settings with loading states and error handling.

```tsx
import { useUserSettings } from '@/hooks';

function ThemeToggle() {
  const { settings, isLoading, updateTheme } = useUserSettings();

  if (isLoading) return <div>Loading settings...</div>;

  const toggleTheme = () => {
    const newTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    updateTheme(newTheme);
  };

  return (
    <button onClick={toggleTheme}>
      Switch to {settings?.theme === 'dark' ? 'Light' : 'Dark'} Mode
    </button>
  );
}
```

## Categorization Hooks

### useCategories

The `useCategories` hook provides access to categories with loading states and error handling.

```tsx
import { useCategories, useResourceHelper } from '@/hooks';

function CategoryList({ sparkId }) {
  const { categories, isLoading, error, addCategoryToResource } = useCategories();
  const { createSparkResource } = useResourceHelper();

  if (isLoading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleAddCategory = async (categoryId) => {
    try {
      const sparkResource = createSparkResource(sparkId);
      await addCategoryToResource(sparkResource, categoryId);
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  return (
    <div>
      <h2>Categories</h2>
      <ul>
        {categories.map(category => (
          <li key={category.id}>
            {category.name}
            <button onClick={() => handleAddCategory(category.id)}>
              Add to Spark
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### useTags

The `useTags` hook provides access to tags with loading states and error handling.

```tsx
import { useTags, useResourceHelper } from '@/hooks';

function TagManager({ bookId }) {
  const { tags, isLoading, error, addTagToResource, createTag } = useTags();
  const { createBookResource } = useResourceHelper();
  const [newTagName, setNewTagName] = useState('');

  if (isLoading) return <div>Loading tags...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleCreateTag = async () => {
    if (!newTagName) return;
    
    try {
      const newTag = await createTag(newTagName);
      if (newTag) {
        const bookResource = createBookResource(bookId);
        await addTagToResource(bookResource, newTag.id);
        setNewTagName('');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  return (
    <div>
      <h2>Tags</h2>
      <div>
        <input 
          type="text" 
          value={newTagName} 
          onChange={(e) => setNewTagName(e.target.value)} 
          placeholder="New tag name" 
        />
        <button onClick={handleCreateTag}>Create and Add</button>
      </div>
      <ul>
        {tags.map(tag => (
          <li key={tag.id}>{tag.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useCategorizationJobs

The `useCategorizationJobs` hook provides access to categorization jobs with loading states and error handling.

```tsx
import { useCategorizationJobs } from '@/hooks';

function JobsManager() {
  const { jobs, isLoading, error, approveJob, rejectJob } = useCategorizationJobs();

  if (isLoading) return <div>Loading jobs...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Pending Categorization Jobs</h2>
      {jobs.length === 0 ? (
        <p>No pending jobs</p>
      ) : (
        <ul>
          {jobs.map(job => (
            <li key={job.id}>
              <div>Source: {job.source}</div>
              <div>Created: {new Date(job.created_at).toLocaleString()}</div>
              <div>
                <button onClick={() => approveJob(job.id)}>Approve</button>
                <button onClick={() => rejectJob(job.id)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Complete Example: Combining Multiple Hooks

This example demonstrates how to use multiple hooks together in a real-world component. It shows a list of sparks with category filtering and the ability to add categories to individual sparks.

### Key Concepts Demonstrated

- Using multiple data hooks together (`useSparks`, `useCategories`)
- Managing loading states across multiple data sources
- Combining resource helpers with categorization hooks
- Handling async operations with proper error handling
- Managing local UI state alongside server data

```tsx
'use client';

import { useState } from 'react';
import { useSparks, useCategories, useResourceHelper } from '@/hooks';

/**
 * Example component that demonstrates using multiple enhanced hooks together.
 * Shows a list of sparks, allows filtering by category, and provides
 * functionality to add categories to sparks.
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
  
  // Combined loading state
  const isLoading = sparksLoading || categoriesLoading;
  
  // Combined error handling
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
        // Note: In a real implementation, you'd need to check if the spark
        // actually has this category assigned. This would require either:
        // 1. Loading category assignments with the sparks
        // 2. Maintaining a separate lookup of spark-category relationships
        return true; // Placeholder
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
                  <h3>{spark.name}</h3>
                  <p>{spark.details.body}</p>
                  
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
```

### Lessons from This Example

1. **Combine loading states**: When using multiple hooks, combine their loading states to show a unified loading indicator.
2. **Handle errors gracefully**: Check for errors from all hooks and display appropriate messages.
3. **Use resource helpers**: The `useResourceHelper` hook helps create properly typed resource objects.
4. **Manage UI state separately**: Keep track of UI state (like expanded items) separately from server data.
5. **Lazy load when needed**: Only fetch related data (like categories for a spark) when the user actually needs it.

## Best Practices

1. **Always handle loading states**: Display loading indicators when data is being fetched.
2. **Implement error handling**: Show appropriate error messages when operations fail.
3. **Use authentication checks**: Make sure users are authenticated before accessing protected data.
4. **Keep components focused**: Each component should use only the hooks it needs, not the entire service.
5. **Destructure only what you need**: Only destructure the specific methods and properties you need from hooks.

Example of good practice:

```tsx
// Good practice
function BookInfo({ bookId }) {
  const { getBookDetails } = useBooksService();
  const { tags, getTagsForResource } = useTags();
  const { createBookResource } = useResourceHelper();
  
  // Component logic...
}
```

Instead of:

```tsx
// Avoid this
function BookInfo({ bookId }) {
  const booksService = useBooksService();
  const tagsHook = useTags();
  const resourceHelper = useResourceHelper();
  
  // Component logic...
}
```

By following these patterns, you'll create components that are easier to maintain, test, and debug. 