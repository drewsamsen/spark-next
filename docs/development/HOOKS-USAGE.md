# React Hooks Usage Guide

This guide provides examples of how to use the custom React hooks in the Spark application.

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Hooks](#basic-hooks)
3. [Advanced Hooks](#advanced-hooks)
4. [Categorization Hooks](#categorization-hooks)
5. [Best Practices](#best-practices)

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