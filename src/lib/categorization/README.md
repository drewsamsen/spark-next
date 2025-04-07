# Categorization System

A flexible, extensible system for managing categories and tags across multiple resource types with full audit trails.

## Overview

This categorization system allows for:

- Categories and tags to be applied to multiple resource types (books, highlights, etc.)
- Creation and management of categories/tags through a type-safe API
- Batch operations through categorization automations
- Full audit trails for AI-driven categorization
- Undo functionality for categorization automations

## Architecture

The system follows a service-oriented architecture with clear separation of concerns:

- **Types**: Core TypeScript interfaces and types
- **Services**: Service interfaces defining the API contract
- **Implementations**: Concrete implementations of the services
- **Database Abstraction**: Helpers to abstract away resource-specific database operations

### Database Schema

The database includes:

- Primary tables: `categories`, `tags`
- Junction tables: `book_categories`, `highlight_categories`, `book_tags`, `highlight_tags`
- Automation tables: `automations`, `automation_actions`

Each category/tag can be applied to multiple resources, and each resource can have multiple categories/tags.

## Using the System

### Getting Service Instances

```typescript
import { getCategoryService, getTagService, getAutomationService, useCategorization } from '@/lib/categorization';

// Option 1: Get individual services
const categoryService = getCategoryService();
const tagService = getTagService();
const automationService = getAutomationService();

// Option 2: Use the convenience hook (for components)
const { categories, tags, automations } = useCategorization();
```

### Working with Categories

```typescript
// Create a new category
const newCategory = await categoryService.createCategory('Programming');

// Get all categories
const allCategories = await categoryService.getCategories();

// Apply category to a book
const bookResource = { 
  id: 'book-uuid', 
  type: 'book',
  userId: 'user-uuid'
};
await categoryService.addCategoryToResource(bookResource, newCategory.id);

// Get categories for a book
const bookCategories = await categoryService.getCategoriesForResource(bookResource);

// Get all resources with a specific category
const resourcesWithCategory = await categoryService.getResourcesForCategory(newCategory.id);

// Get only books with a specific category
const booksWithCategory = await categoryService.getResourcesForCategory(newCategory.id, 'book');

// Remove a category from a resource
await categoryService.removeCategoryFromResource(bookResource, newCategory.id);
```

### Working with Tags

Similar to categories, but without the `slug` property:

```typescript
// Create a new tag
const newTag = await tagService.createTag('must-read');

// Get all tags
const allTags = await tagService.getTags();

// Apply tag to a highlight
const highlightResource = { 
  id: 'highlight-uuid', 
  type: 'highlight',
  userId: 'user-uuid'
};
await tagService.addTagToResource(highlightResource, newTag.id);

// Get tags for a highlight
const highlightTags = await tagService.getTagsForResource(highlightResource);

// Get resources with a specific tag
const resourcesWithTag = await tagService.getResourcesForTag(newTag.id);

// Remove a tag from a resource
await tagService.removeTagFromResource(highlightResource, newTag.id);
```

### Categorization Automations

Automations allow for batch operations and provide an audit trail:

```typescript
// Create an automation with multiple actions
const automation = {
  userId: 'user-uuid',
  name: 'AI Categorization Batch',
  source: 'ai',
  actions: [
    // Create and apply a new category
    {
      actionType: 'create_category',
      categoryName: 'Philosophy',
      resource: bookResource
    },
    // Apply an existing category
    {
      actionType: 'add_category',
      categoryId: existingCategoryId,
      resource: bookResource
    },
    // Create and apply a new tag
    {
      actionType: 'create_tag',
      tagName: 'favorite',
      resource: highlightResource
    }
  ]
};

// Create the automation (all actions are applied immediately)
const result = await automationService.createAutomation(automation);

// Later, if needed:
// Approve the automation (marks it as approved)
await automationService.approveAutomation(result.automationId);

// OR: Reject the automation (undoes all actions and removes created categories/tags)
await automationService.rejectAutomation(result.automationId);
```

### Finding Origin of Categories/Tags

You can trace which automation added a particular category or tag:

```typescript
// Find which automation added a category to a resource
const originAutomation = await automationService.findOriginatingAutomation(
  bookResource, 
  categoryId // Optional: specify categoryId or tagId
);

if (originAutomation) {
  console.log(`Added by "${originAutomation.name}" automation from ${originAutomation.source}`);
}
```

## Extending the System

### Adding New Resource Types

To add a new resource type (e.g., "notes"):

1. Update the `ResourceType` type in `types.ts`:
   ```typescript
   export type ResourceType = 'book' | 'highlight' | 'note';
   ```

2. Add new mappings in `db-utils.ts`:
   ```typescript
   // Add to junction table mapping
   const CATEGORY_JUNCTION_TABLES = {
     book: 'book_categories',
     highlight: 'highlight_categories',
     note: 'note_categories'
   };
   
   // Add to resource ID column mapping
   const RESOURCE_ID_COLUMNS = {
     book: 'book_id',
     highlight: 'highlight_id',
     note: 'note_id'
   };
   ```

3. Create necessary database migration for the new junction tables

### Implementation Details

The system uses:

- Singleton pattern for service instances
- Resource-type abstraction with mapping functions
- Generic interfaces for type safety
- SQL transactions for data integrity
- Proper error handling with detailed error messages

## AI Categorization Example

Here's a complete example of implementing AI-suggested categorization:

```typescript
async function suggestCategoriesWithAI(book) {
  const { categories, tags, automations } = useCategorization();
  
  // 1. Call your AI service to get suggestions
  const aiResponse = await callAIService(book.title, book.content);
  
  // 2. Prepare automation actions
  const actions = [];
  const resource = { id: book.id, type: 'book', userId: book.userId };
  
  // Add category creation/assignment actions
  for (const categoryName of aiResponse.suggestedCategories) {
    actions.push({
      actionType: 'create_category', // Will create if doesn't exist
      categoryName,
      resource
    });
  }
  
  // Add tag creation/assignment actions
  for (const tagName of aiResponse.suggestedTags) {
    actions.push({
      actionType: 'create_tag', // Will create if doesn't exist
      tagName,
      resource
    });
  }
  
  // 3. Create the automation
  const result = await automations.createAutomation({
    userId: book.userId,
    name: `AI categorization for "${book.title}"`,
    source: 'ai',
    actions
  });
  
  // 4. Check the result
  if (result.success) {
    toast.success('AI categorization applied!');
    console.log('Created resources:', result.createdResources);
    return result.automationId;
  } else {
    toast.error(`Failed to apply AI categorization: ${result.error}`);
    return null;
  }
}
```

## Error Handling

All service methods include proper error handling:

- Service methods that retrieve data handle errors gracefully, typically returning empty arrays
- Service methods that modify data throw descriptive errors
- The automation service includes detailed error information in the result object

## TypeScript Types

The system is fully typed for safety and developer experience. Key types include:

- `ResourceType`: Union of supported resource types
- `Resource`: Generic interface for categorizable resources
- `Category` and `Tag`: Core entity interfaces
- `CategorizationAutomation` and `CategorizationAction`: Automation-related interfaces
- `CategoryService`, `TagService`, and `AutomationService`: Service interfaces 