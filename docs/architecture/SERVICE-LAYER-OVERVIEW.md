# Service Layer Architecture - Implementation Overview

This document provides an overview of the service layer abstraction implemented for the Spark application.

## Architecture Layers

The implementation follows a clean layered architecture with the following components:

1. **Repository Layer**: Direct database access
2. **Service Layer**: Business logic and operations
3. **React Hooks**: Client-side access to services

## Directory Structure

```
src/
├── lib/
│   ├── db.ts                   # Database utilities
│   ├── errors.ts               # Custom error classes (ServiceError, DatabaseError, etc.)
│   ├── error-handling.ts       # Error handling utilities and helpers
│   ├── types.ts                # Shared type definitions and domain models
│   └── categorization/         # Categorization type definitions and services
├── repositories/               # Repository classes for data access
│   ├── base.repository.ts      # Base repository with shared functionality
│   ├── sparks.repository.ts    # Sparks data access
│   ├── books.repository.ts     # Books data access
│   ├── highlights.repository.ts # Highlights data access
│   ├── categories.repository.ts # Categories data access
│   ├── tags.repository.ts      # Tags data access
│   ├── notes.repository.ts     # Notes data access
│   ├── auth.repository.ts      # Authentication data access
│   ├── integrations.repository.ts # Integrations data access
│   ├── automations.repository.ts # Automations data access
│   ├── function-logs.repository.ts # Function logs data access
│   ├── user-settings.repository.ts # User settings data access
│   ├── categorization.repository.ts # Categorization operations
│   ├── content.repository.ts   # Content data access (placeholder)
│   ├── types.ts                # Shared types for repositories
│   └── index.ts                # RepositoriesRegistry and exports
├── services/                   # Service layer with business logic
│   ├── base.service.ts         # Base service class with common CRUD operations
│   ├── sparks.service.ts       # Sparks business logic
│   ├── books.service.ts        # Books business logic
│   ├── highlights.service.ts   # Highlights business logic
│   ├── notes.service.ts        # Notes business logic
│   ├── categorization.service.ts # Categorization (categories, tags, automations)
│   ├── auth.service.ts         # Authentication business logic
│   ├── integrations.service.ts # Integrations (Readwise, Airtable)
│   ├── airtable.service.ts     # Airtable-specific operations
│   ├── function-logs.service.ts # Function logs business logic
│   ├── user-settings.service.ts # User settings business logic
│   ├── sidebar.service.ts      # Sidebar state and navigation
│   ├── header.service.ts       # Header state and navigation
│   ├── content.service.ts      # Content operations (demo data)
│   └── index.ts                # Services bundler and exports
└── hooks/                      # React hooks for accessing services
    ├── auth/                   # Authentication hooks
    │   ├── use-auth-session.ts # Session management hook
    │   └── index.ts
    ├── services/               # Service layer access hooks
    │   ├── use-services.ts     # Main service hooks (useSparksService, etc.)
    │   ├── use-content-service.ts
    │   ├── use-function-logs-service.ts
    │   ├── use-notes-service.ts
    │   ├── use-sidebar-service.ts
    │   ├── use-user-settings-service.ts
    │   └── index.ts
    ├── data/                   # Data management hooks (with React state)
    │   ├── use-sparks.ts
    │   ├── use-categorization.ts
    │   ├── use-function-logs.ts
    │   ├── use-user-settings.ts
    │   └── index.ts
    ├── patterns/               # Reusable hook patterns
    │   ├── use-base-resource.ts
    │   ├── use-realtime-subscription.ts
    │   └── index.ts
    ├── ui/                     # UI state management hooks
    │   ├── use-storage.ts
    │   ├── useSidebarData.ts
    │   └── index.ts
    └── index.ts                # Export all hooks
```

## Key Components

### Error Handling

The application uses a comprehensive error handling system:

**Custom Error Classes** (`lib/errors.ts`):
- `ServiceError` - Base class for service-related errors
- `DatabaseError` - Database operation errors
- `AuthError` - Authentication/authorization errors
- `NotFoundError` - Resource not found errors
- `ValidationError` - Validation errors

**Error Handler Functions** (`lib/errors.ts`):
- `handleServiceError<T>()` - Returns empty array for collection results
- `handleServiceItemError<T>()` - Returns null for single item results

**Advanced Error Handling** (`lib/error-handling.ts`):
- `handleError()` - Standardized error logging with toast notifications
- `handleHookError<T>()` - Hook-friendly error handler returning null
- `handleHookCollectionError<T>()` - Hook-friendly error handler returning empty array
- `tryCatch<T>()` - Async try/catch wrapper returning null on error
- `tryCatchCollection<T>()` - Async try/catch wrapper returning empty array on error
- `getErrorMessage()` - Extract user-friendly error messages
- `getToastType()` - Determine appropriate toast notification type

### Database Access

- **DbClient**: Type-safe Supabase client from `lib/db.ts`
- **BaseRepository**: Abstract class with common CRUD operations (getAll, getById, create, update, delete)
- **Entity Repositories**: Specialized repositories extending BaseRepository for each entity type
- **Repository Registry**: `RepositoriesRegistry` class providing singleton access to repositories
  - `getRepositories()` - Browser-side singleton instance
  - `getServerRepositories()` - Server-side instance (creates new instance per call)
  - Lazy initialization of repository instances
  - Supports both client and server contexts

### Business Logic Services

The service layer uses multiple implementation patterns:

**Class-based Services with BaseService**:
- `SparksService`, `BooksService`, `HighlightsService`, `FunctionLogsService`
- Extend `BaseService<T, R>` abstract class
- Inherit common CRUD operations (getAll, getById, create, update, delete)
- Add domain-specific methods as needed

**Class-based Services without BaseService**:
- `NotesService`, `AuthService`, `IntegrationsService`, etc.
- Custom implementation without base class inheritance
- Used when base CRUD pattern doesn't fit the use case

**Object Export Services**:
- `categorizationService` - Combines categoryService, tagService, automationService
- `contentService` - Provides dashboard content (currently demo data)
- Used for grouping related functionality or simple stateless services

**Service Registry**:
- All services exported from `services/index.ts`
- Bundled in a `services` object for easy access
- Services are singleton instances

### React Integration

The hook layer is organized into distinct categories:

**Service Hooks** (`hooks/services/`):
- Direct access to service layer without additional state management
- `useSparksService()`, `useBooksService()`, `useHighlightsService()`, etc.
- Simply return the service instance for use in components
- Minimal wrapper around services

**Data Hooks** (`hooks/data/`):
- Add React state management on top of services
- `useSparks()`, `useCategories()`, `useTags()`, etc.
- Include loading states, error handling, and data caching
- Follow the standard data hook pattern with `data`, `isLoading`, `error`
- Subscribe to auth state changes and refetch data accordingly

**Auth Hooks** (`hooks/auth/`):
- `useAuthSession()` - Manages authentication session state
- Provides current user information and auth status

**Pattern Hooks** (`hooks/patterns/`):
- Reusable patterns for common operations
- `useBaseResource()` - Generic resource management pattern
- `useRealTimeSubscription()` - Real-time data subscription pattern

**UI Hooks** (`hooks/ui/`):
- UI state management
- `useStorage()` - Local/session storage management
- `useSidebarData()` - Sidebar state management

## Implementation Patterns

### Repository Pattern

Each entity has a repository responsible for:
- CRUD operations on the entity
- Querying related entities
- Data transformations between database and domain models

Example:
```typescript
// Get all tags for a resource
async getTagsForResource(resource: Resource): Promise<TagModel[]> {
  const userId = await this.getUserId();
  
  // Validate the resource
  if (resource.userId !== userId) {
    throw new ValidationError('Cannot access resource from another user');
  }
  
  // Get the right junction table and resource ID column
  const { junctionTable, resourceIdColumn } = this.getJunctionInfo(resource.type);
  
  // First get the tag IDs from the junction table
  const { data: junctionData, error: junctionError } = await this.client
    .from(junctionTable)
    .select('tag_id')
    .eq(resourceIdColumn, resource.id);
  
  // ... rest of implementation
}
```

### Service Pattern

Services implement business logic and use repositories for data access:
- Error handling and validation
- Data transformation and enrichment
- Cross-entity operations

Example:
```typescript
// Create a new spark
async createSpark(input: Omit<CreateSparkInput, 'md5Uid'>): Promise<SparkDomain | null> {
  try {
    const repo = getRepositories().sparks;
    
    // Generate a simple hash to avoid duplicates
    const md5Uid = await this.generateMd5Hash(input.body);
    
    // Create the spark
    const newSpark = await repo.createSpark({
      ...input,
      md5Uid
    });
    
    // Get the full details with relationships
    const sparkWithRelations = await repo.getSparkById(newSpark.id);
    
    if (!sparkWithRelations) {
      return null;
    }
    
    return repo.mapToDomain(sparkWithRelations);
  } catch (error) {
    return handleServiceItemError<SparkDomain>(error, 'Error in sparksService.createSpark');
  }
}
```

### Hook Pattern

React hooks provide clean access to services in components. There are two main patterns:

**Service Hook Pattern** (Direct service access):
```typescript
function SparkComponent({ sparkId }: { sparkId: string }) {
  const sparksService = useSparksService();
  const { getSparks, getSparkDetails } = sparksService;
  
  // Use service methods directly
  // No built-in state management - handle loading/error states yourself
}
```

**Data Hook Pattern** (Service + React state):
```typescript
function SparksListComponent() {
  const { data: sparks, isLoading, error, fetchData } = useSparks();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {sparks.map(spark => (
        <div key={spark.id}>{spark.details.body}</div>
      ))}
    </div>
  );
}
```

**When to Use Each**:
- Use **service hooks** when you need imperative control (e.g., form submissions, button clicks)
- Use **data hooks** when you need declarative data loading with automatic state management

## Benefits of this Architecture

1. **Separation of Concerns**: Each layer has a clear responsibility
2. **Testability**: Services and repositories can be tested independently 
3. **Maintainability**: Changes in one layer don't affect others
4. **Consistency**: Standard patterns across the application
5. **Type Safety**: Strong typing throughout the stack
6. **Error Handling**: Standardized error handling and recovery

## Integration with Existing Code

Existing components can gradually migrate to using the service layer:

1. Import the appropriate service hook
2. Replace direct Supabase calls with service calls
3. Leverage the error handling in the service layer

## Current State and Known Patterns

### Service Implementation Inconsistencies

The codebase currently uses **three different service patterns**:

1. **Class extending BaseService** (sparks, books, highlights, function-logs)
   - Best for entities with standard CRUD operations
   - Inherits common methods from BaseService
   
2. **Standalone class** (notes, auth, integrations)
   - Used when BaseService pattern doesn't fit
   - Full custom implementation
   
3. **Object export** (categorization, content)
   - Used for grouping related services
   - Simple stateless operations

### Content Service Status

- `content.service.ts` and `content.repository.ts` exist as **infrastructure placeholders**
- Currently return demo/static data for dashboard
- Ready for future implementation when content features are needed

### Hook Organization

Hooks are split into multiple directories based on purpose:
- `hooks/services/` - Thin wrappers around services
- `hooks/data/` - Services + React state management
- `hooks/auth/` - Authentication-specific hooks
- `hooks/patterns/` - Reusable patterns
- `hooks/ui/` - UI state management

This organization provides flexibility but may benefit from standardization (see ARCHITECTURE-IMPROVEMENTS.md).

## Future Improvements

1. Standardize service implementation patterns (see ARCHITECTURE-IMPROVEMENTS.md)
2. Implement content repository with real data persistence
3. Add caching strategies at the service layer
4. Consider adding server actions for Next.js App Router patterns
5. Add comprehensive error boundaries for React components
6. Implement optimistic updates pattern across all data hooks 