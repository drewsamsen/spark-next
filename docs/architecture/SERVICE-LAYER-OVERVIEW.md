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
│   ├── errors.ts               # Error handling utilities
│   └── categorization/         # Categorization type definitions
├── repositories/               # Repository classes for data access
│   ├── base.repository.ts      # Base repository with shared functionality
│   ├── sparks.repository.ts    # Sparks repository
│   ├── books.repository.ts     # Books repository
│   ├── highlights.repository.ts # Highlights repository
│   ├── categories.repository.ts # Categories repository
│   ├── tags.repository.ts      # Tags repository
│   ├── types.ts                # Shared types for repositories
│   └── index.ts                # Registry for all repositories
├── services/                   # Service layer with business logic
│   ├── sparks.service.ts       # Sparks service
│   ├── books.service.ts        # Books service
│   ├── highlights.service.ts   # Highlights service 
│   ├── categorization.service.ts # Categorization service (categories, tags, jobs)
│   └── index.ts                # Export of all services
└── hooks/                      # React hooks for accessing services
    ├── use-services.ts         # Hooks for each service
    └── index.ts                # Export of all hooks
```

## Key Components

### Error Handling

- **CustomError Classes**: `ServiceError`, `DatabaseError`, `AuthError`, etc.
- **Error Handler Functions**: `handleServiceError`, `handleServiceItemError`

### Database Access

- **DbClient**: Type-safe Supabase client
- **BaseRepository**: Abstract class with common repository functionality
- **Entity Repositories**: Specialized repositories for each entity type
- **Repository Registry**: Singleton access to repositories

### Business Logic Services

- **Entity Services**: Business logic for each entity type
- **Service Interfaces**: Clear contracts for service implementations
- **Domain Models**: Clean models for business logic

### React Integration

- **Service Hooks**: React hooks to access services in components
- **Resource Helpers**: Utilities for working with resources

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

React hooks provide clean access to services in components:
- Type-safe access to services
- Consistent usage pattern
- Separation of UI and business logic

Example:
```typescript
function SparkComponent({ sparkId }: { sparkId: string }) {
  const { getSparks, getSparkDetails } = useSparksService();
  const { tags } = useCategorization();
  
  // Use services to interact with data
}
```

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

## Future Improvements

1. Complete implementation of the job service with database persistence
2. Add additional repositories for other entities
3. Integrate with server actions for Next.js
4. Add caching strategies at the service layer 