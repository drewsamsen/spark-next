# Architecture Improvements and Standardization

This document outlines recommended improvements and standardizations for the Spark application's service layer architecture.

## Overview

While the current architecture follows a clean layered approach (Repository → Service → Hook → Component), there are opportunities for standardization and improvement to enhance consistency, maintainability, and developer experience.

## Current Inconsistencies

### 1. Service Implementation Patterns

**Issue**: Three different service implementation patterns are used throughout the codebase:

1. **Class extending BaseService**
   - Files: `sparks.service.ts`, `books.service.ts`, `highlights.service.ts`, `function-logs.service.ts`
   - Pattern: `class XService extends BaseService<Model, Repository>`
   - Pros: DRY, consistent CRUD operations, less boilerplate
   - Cons: Limited to entities that fit CRUD pattern

2. **Standalone Class**
   - Files: `notes.service.ts`, `auth.service.ts`, `integrations.service.ts`, `user-settings.service.ts`, `airtable.service.ts`
   - Pattern: `class XService { ... }` (no base class)
   - Pros: Full flexibility, custom implementation
   - Cons: More boilerplate, inconsistent patterns

3. **Object Export**
   - Files: `categorization.service.ts`, `content.service.ts`, `sidebar.service.ts`, `header.service.ts`
   - Pattern: `export const xService = { ... }`
   - Pros: Simple, stateless, easy to tree-shake
   - Cons: No class benefits (inheritance, protected methods)

**Impact**: Developers must remember which pattern each service uses. Code review is harder. Onboarding is slower.

### 2. Hook Organization

**Issue**: Hooks are split across multiple directories with overlapping purposes:

- `hooks/services/` - Direct service access (e.g., `useSparksService()`)
- `hooks/data/` - Service + state management (e.g., `useSparks()`)
- Some entities have both patterns, some have only one
- No clear naming convention to distinguish between them

**Impact**: 
- Confusion about which hook to use when
- Duplicate functionality in some cases
- Inconsistent patterns across features

### 3. Repository Access Pattern

**Issue**: Some services access repositories through the registry, others might instantiate directly:

```typescript
// Pattern A: Through registry (most common)
class SparksService extends BaseService<SparkModel, SparksRepository> {
  constructor() {
    super(getRepositories().sparks);
  }
}

// Pattern B: Direct instantiation (if used)
const repo = new SparksRepository(client);
```

**Impact**: Inconsistent singleton behavior, potential for multiple instances.

### 4. Error Handling Duplication

**Issue**: Two similar error handling utilities:
- `lib/errors.ts` - `handleServiceError()`, `handleServiceItemError()`
- `lib/error-handling.ts` - `handleError()`, `handleHookError()`, `tryCatch()`, etc.

**Impact**: Developers unsure which to use when. Some overlap in functionality.

## Recommended Improvements

### Priority 1: Standardize Service Patterns

**Recommendation**: Choose ONE primary service pattern and migrate all services to it.

**Preferred Approach**: Use **class-based services** as the default pattern:

```typescript
// For entities with standard CRUD
class EntityService extends BaseService<Model, Repository> {
  constructor() {
    super(getRepositories().entity);
  }
  
  // Add custom methods as needed
}

// For non-CRUD services
class UtilityService {
  // Full custom implementation
  // Still a class for consistency
}
```

**Migration Plan**:
1. Keep `BaseService` for CRUD entities
2. Convert object exports to classes (categorization, content, sidebar, header)
3. Document when to use BaseService vs standalone class
4. Update all service exports to be singleton instances

**Benefits**:
- Consistent pattern across all services
- Easier to understand and maintain
- Better TypeScript support
- Clearer inheritance hierarchy

### Priority 2: Clarify Hook Patterns

**Recommendation**: Establish clear naming and organizational conventions:

**Pattern A - Service Hooks** (in `hooks/services/`):
```typescript
// Thin wrapper, returns service instance
export function useSparksService() {
  return services.sparks;
}
```
**Use when**: You need imperative control (form handlers, button clicks, etc.)

**Pattern B - Data Hooks** (in `hooks/data/`):
```typescript
// Adds React state management
export function useSparks() {
  const [data, setData] = useState<EnhancedSparkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // ... load data with useEffect
  return { data, isLoading, error, refetch };
}
```
**Use when**: You need declarative data loading with automatic state management

**Migration Plan**:
1. Ensure every major entity has both patterns (if needed)
2. Document the difference clearly
3. Use consistent naming: `useXService()` vs `useX()`
4. Add JSDoc comments explaining which to use when

### Priority 3: Consolidate Error Handling

**Recommendation**: Merge or clarify the two error handling utilities:

**Option A - Keep Both** (Recommended):
- `lib/errors.ts` - For service layer use only
  - `handleServiceError()` - Use in service methods
  - `handleServiceItemError()` - Use in service methods
  
- `lib/error-handling.ts` - For component/hook layer use
  - `handleError()` - Use in components for user-facing errors
  - `handleHookError()` - Use in custom hooks
  - `tryCatch()` - Use for async operations in hooks/components

**Option B - Merge Into One**:
- Combine both files into `lib/error-handling.ts`
- Provide both service-layer and component-layer utilities
- Add clear documentation on when to use each

**Migration Plan**:
1. Add JSDoc comments explaining usage context
2. Create examples in documentation
3. Update existing code to use consistently

### Priority 4: Complete Content Service Implementation

**Current State**: 
- `content.service.ts` returns demo/static data
- `content.repository.ts` has placeholder methods
- Used only by dashboard components

**Recommendation**:
1. **Short-term**: Document that this is intentional demo data
2. **Long-term**: Implement when content/document features are built
3. Consider renaming to `dashboard.service.ts` to be more specific
4. Or remove if not needed and move demo data directly to components

### Priority 5: Add Service Layer Documentation

**Recommendation**: Create comprehensive documentation for each pattern:

1. **REPOSITORY-PATTERN.md**
   - When to extend BaseRepository
   - How to add custom queries
   - Working with Supabase client
   - Testing strategies

2. **SERVICE-PATTERN.md**
   - When to extend BaseService
   - When to use standalone class
   - Error handling best practices
   - Business logic organization

3. **HOOK-PATTERN.md**
   - Service hooks vs data hooks
   - When to use each
   - State management patterns
   - Error handling in hooks

## Implementation Priority

### Phase 1: Documentation (1-2 days)
- [ ] Document current patterns clearly
- [ ] Create decision guides for developers
- [ ] Add examples for each pattern
- [ ] Update onboarding materials

### Phase 2: Standardization (1 week)
- [ ] Standardize service patterns (convert object exports to classes)
- [ ] Ensure consistent hook naming
- [ ] Add JSDoc comments to all services and hooks
- [ ] Update error handling usage

### Phase 3: Enhancement (2-3 weeks)
- [ ] Add missing data hooks where needed
- [ ] Implement caching strategies
- [ ] Add optimistic updates pattern
- [ ] Consider React Query integration

### Phase 4: Future Improvements (ongoing)
- [ ] Server actions integration
- [ ] Real-time subscriptions for all entities
- [ ] Comprehensive error boundaries
- [ ] Performance monitoring

## Decision Framework

When adding new features, use this decision tree:

### For Repositories
```
Does the entity need database access?
├─ Yes: Create repository extending BaseRepository
└─ No: Don't create repository

Does it need custom queries beyond CRUD?
├─ Yes: Add custom methods to repository class
└─ No: Use inherited methods from BaseRepository
```

### For Services
```
Does the entity have standard CRUD operations?
├─ Yes: Extend BaseService<Model, Repository>
└─ No: Create standalone class

Does it need to group multiple services?
├─ Yes: Create object with sub-services (like categorization)
└─ No: Use class pattern
```

### For Hooks
```
Do components need state management?
├─ Yes: Create data hook in hooks/data/ (with useState, useEffect)
└─ No: Create service hook in hooks/services/ (thin wrapper)

Is it reusable across entities?
├─ Yes: Create pattern hook in hooks/patterns/
└─ No: Create entity-specific hook
```

## Benefits of Standardization

1. **Reduced Cognitive Load**: Developers know which pattern to use
2. **Faster Onboarding**: New team members learn one pattern, apply everywhere
3. **Easier Maintenance**: Consistent code is easier to update and refactor
4. **Better Testing**: Standardized patterns make testing more consistent
5. **Improved DX**: Better IDE support, clearer error messages
6. **Code Quality**: Less duplication, more reusable code

## Migration Strategy

To avoid disrupting existing functionality:

1. **Document First**: Make current patterns explicit
2. **Standardize New Code**: Apply new patterns to all new features
3. **Gradual Migration**: Update existing code during feature work
4. **No Big Bang**: Don't rewrite everything at once
5. **Measure Impact**: Track improvements in developer velocity

## Developer Stories

The following stories should be implemented **in order** from top to bottom. Each story is self-contained and can be completed independently while building toward the larger architectural improvements.

---

### Story 1: Document Error Handling Usage Patterns ✅

**Goal**: Add clear JSDoc comments to all error handling utilities explaining when to use each function.

**Why This First**: Documentation is non-disruptive and helps developers understand the system before making changes.

**Requirements**:
- Add JSDoc comments to all functions in `lib/errors.ts`
- Add JSDoc comments to all functions in `lib/error-handling.ts`
- Include usage examples in comments
- Specify which layer (service vs component/hook) each function is for

**Files to Modify**:
- `src/lib/errors.ts`
- `src/lib/error-handling.ts`

**Acceptance Criteria**:
- [x] Every exported function has a JSDoc comment
- [x] Comments explain WHEN to use the function (service layer vs component layer)
- [x] Comments include at least one code example
- [x] Comments specify return type and error handling behavior

**Completed**: All error handling utilities in both files now have comprehensive JSDoc documentation following the established conventions. Each function includes:
- Clear layer guidance (service vs hook vs component)
- Decision guidance (when to use vs alternatives)
- Behavioral notes and side effects
- Multiple realistic usage examples
- Cross-references to related functions

**Example**:
```typescript
/**
 * Handle errors in service layer methods that return collections.
 * Returns an empty array on error and logs to console.
 * 
 * USE IN: Service class methods that return arrays
 * DO NOT USE IN: React components or hooks (use handleHookCollectionError instead)
 * 
 * @example
 * async getSparks(): Promise<SparkDomain[]> {
 *   try {
 *     return await this.repository.getSparks();
 *   } catch (error) {
 *     return handleServiceError<SparkDomain>(error, 'Error in getSparks');
 *   }
 * }
 */
export function handleServiceError<T>(error: any, context: string): T[] {
  // ... implementation
}
```

---

### Story 2: Add JSDoc Comments to BaseRepository

**Goal**: Document the BaseRepository class methods and patterns for extending it.

**Why This Second**: Establishes the foundation pattern before documenting services that depend on it.

**Requirements**:
- Add JSDoc to BaseRepository class
- Document all protected methods
- Explain when to use vs override base methods
- Include examples of custom repository methods

**Files to Modify**:
- `src/repositories/base.repository.ts`

**Acceptance Criteria**:
- [ ] Class has overview JSDoc explaining purpose and usage
- [ ] Each method has JSDoc with parameters and return types
- [ ] Protected methods explain their intended use
- [ ] File includes a usage example at the top

**Example**:
```typescript
/**
 * Base repository class providing common CRUD operations for all entities.
 * 
 * EXTEND THIS CLASS when creating a new repository for database entities.
 * 
 * @example
 * export class CustomRepository extends BaseRepository<CustomModel> {
 *   constructor(client: DbClient) {
 *     super(client, 'custom_table');
 *   }
 *   
 *   // Add custom queries here
 *   async findByEmail(email: string): Promise<CustomModel | null> {
 *     // ... custom implementation
 *   }
 * }
 */
export abstract class BaseRepository<T extends Record<string, any>> {
  // ...
}
```

---

### Story 3: Add JSDoc Comments to BaseService

**Goal**: Document the BaseService class and when to extend it vs create standalone services.

**Why This Third**: Completes foundation documentation before documenting specific implementations.

**Requirements**:
- Add JSDoc to BaseService class
- Document when to extend vs create standalone class
- Explain the repository parameter
- Include examples for both patterns

**Files to Modify**:
- `src/services/base.service.ts`

**Acceptance Criteria**:
- [ ] Class has overview JSDoc with decision guidance
- [ ] Each method has JSDoc
- [ ] Comments explain error handling behavior
- [ ] File includes examples for extending and standalone patterns

**Example**:
```typescript
/**
 * Base service class providing common CRUD operations.
 * 
 * EXTEND THIS CLASS when your entity has standard CRUD operations.
 * CREATE STANDALONE CLASS when entity doesn't fit CRUD pattern.
 * 
 * @example
 * // Extending BaseService
 * class SparksService extends BaseService<SparkModel, SparksRepository> {
 *   constructor() {
 *     super(getRepositories().sparks);
 *   }
 * }
 * 
 * // Standalone class (when CRUD doesn't fit)
 * class AuthService {
 *   async login(email: string, password: string) { ... }
 *   async logout() { ... }
 * }
 */
export abstract class BaseService<T, R extends BaseRepository<T>> {
  // ...
}
```

---

### Story 4: Document Service Hook Pattern

**Goal**: Add JSDoc to all service hooks explaining their purpose and when to use them vs data hooks.

**Why This Fourth**: Helps developers understand the two hook patterns before adding new hooks.

**Requirements**:
- Add JSDoc to `hooks/services/use-services.ts`
- Document each service hook function
- Explain difference between service hooks and data hooks
- Add examples to file header

**Files to Modify**:
- `src/hooks/services/use-services.ts`
- `src/hooks/services/index.ts`

**Acceptance Criteria**:
- [ ] File header explains service hooks vs data hooks
- [ ] Each hook function has JSDoc with usage guidance
- [ ] Comments specify when to use service hooks vs data hooks
- [ ] File includes comparison example

**Example**:
```typescript
/**
 * Service Hooks - Direct access to service layer
 * 
 * USE SERVICE HOOKS WHEN:
 * - You need imperative control (form handlers, button clicks)
 * - You'll manage loading/error states yourself
 * - You want maximum flexibility
 * 
 * USE DATA HOOKS WHEN:
 * - You need automatic state management
 * - You want built-in loading/error states
 * - You need declarative data fetching
 * 
 * @example
 * // Service hook (imperative)
 * function CreateSparkForm() {
 *   const sparksService = useSparksService();
 *   const [isLoading, setIsLoading] = useState(false);
 *   
 *   async function handleSubmit() {
 *     setIsLoading(true);
 *     await sparksService.createSpark(data);
 *     setIsLoading(false);
 *   }
 * }
 * 
 * // Data hook (declarative)
 * function SparksList() {
 *   const { data, isLoading, error } = useSparks();
 *   // State managed automatically
 * }
 */

/**
 * Access the sparks service for imperative operations.
 * Returns the service instance for manual control.
 * 
 * @returns SparksService instance
 * @see useSparks for declarative data loading with automatic state management
 */
export function useSparksService() {
  return services.sparks;
}
```

---

### Story 5: Document Data Hook Pattern

**Goal**: Add JSDoc to data hooks explaining their state management and usage patterns.

**Why This Fifth**: Completes hook documentation for developers to reference.

**Requirements**:
- Add JSDoc to hooks in `hooks/data/`
- Document the return object structure
- Explain automatic state management
- Include usage examples

**Files to Modify**:
- `src/hooks/data/use-sparks.ts`
- `src/hooks/data/use-categorization.ts`
- `src/hooks/data/use-function-logs.ts`
- `src/hooks/data/use-user-settings.ts`
- `src/hooks/data/index.ts`

**Acceptance Criteria**:
- [ ] Each hook has comprehensive JSDoc
- [ ] Return object structure is documented
- [ ] Loading and error behavior is explained
- [ ] Auth state subscription is documented

**Example**:
```typescript
/**
 * Data hook for sparks with automatic state management.
 * 
 * Automatically loads sparks on mount and when auth state changes.
 * Provides loading states, error handling, and refetch capability.
 * 
 * @returns {Object} Sparks data and control methods
 * @returns {EnhancedSparkItem[]} data - Array of spark items
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {Error | null} error - Error object if fetch failed
 * @returns {Function} refetch - Manual refetch function
 * 
 * @example
 * function SparksPage() {
 *   const { data: sparks, isLoading, error } = useSparks();
 *   
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return (
 *     <div>
 *       {sparks.map(spark => <SparkCard key={spark.id} {...spark} />)}
 *     </div>
 *   );
 * }
 */
export function useSparks() {
  // ... implementation
}
```

---

### Story 6: Create REPOSITORY-PATTERN.md

**Goal**: Create comprehensive documentation for repository pattern usage.

**Why This Sixth**: Provides developers with a complete guide for creating repositories.

**Requirements**:
- Create new file `docs/architecture/REPOSITORY-PATTERN.md`
- Explain when to create a repository
- Show how to extend BaseRepository
- Include examples of custom queries
- Document testing strategies

**Files to Create**:
- `docs/architecture/REPOSITORY-PATTERN.md`

**Acceptance Criteria**:
- [ ] Document explains repository purpose in layered architecture
- [ ] Includes decision tree for when to create repository
- [ ] Shows complete example of extending BaseRepository
- [ ] Documents common patterns (joins, filters, pagination)
- [ ] Includes testing examples

**Content Outline**:
1. What is a Repository?
2. When to Create a Repository
3. Extending BaseRepository
4. Common Patterns (with examples)
5. Testing Strategies
6. Real-world Examples from Codebase

---

### Story 7: Create SERVICE-PATTERN.md

**Goal**: Create comprehensive documentation for service pattern usage.

**Why This Seventh**: Completes the pattern documentation trilogy.

**Requirements**:
- Create new file `docs/architecture/SERVICE-PATTERN.md`
- Explain when to extend BaseService vs create standalone class
- Document error handling patterns
- Include business logic organization best practices
- Show examples from codebase

**Files to Create**:
- `docs/architecture/SERVICE-PATTERN.md`

**Acceptance Criteria**:
- [ ] Document explains service layer purpose
- [ ] Decision tree for BaseService vs standalone class
- [ ] Error handling patterns documented
- [ ] Business logic organization guidance
- [ ] Multiple real examples from codebase

**Content Outline**:
1. Service Layer Purpose
2. Three Service Patterns (with when to use each)
3. Error Handling in Services
4. Business Logic Organization
5. Testing Services
6. Migration Guide (object export to class)

---

### Story 8: Create HOOK-PATTERN.md

**Goal**: Create comprehensive documentation for React hook patterns.

**Why This Eighth**: Completes developer documentation before beginning refactoring.

**Requirements**:
- Create new file `docs/architecture/HOOK-PATTERN.md`
- Document service hooks vs data hooks clearly
- Explain when to use each pattern
- Include state management patterns
- Show error handling in hooks

**Files to Create**:
- `docs/architecture/HOOK-PATTERN.md`

**Acceptance Criteria**:
- [ ] Clear distinction between service and data hooks
- [ ] Decision tree for hook type selection
- [ ] State management patterns documented
- [ ] Auth integration explained
- [ ] Testing strategies included

**Content Outline**:
1. Hook Layer Purpose
2. Service Hooks (with examples)
3. Data Hooks (with examples)
4. Pattern Hooks (reusable patterns)
5. UI Hooks (UI state only)
6. When to Use Each Type
7. Testing Hooks

---

### Story 9: Convert content.service.ts to Class Pattern

**Goal**: Convert the content service from object export to class pattern for consistency.

**Why This Ninth**: First refactoring task using the new documentation as a guide.

**Requirements**:
- Convert `content.service.ts` from object export to class
- Keep current functionality (demo data) unchanged
- Update exports in `services/index.ts`
- Add JSDoc comments using new pattern

**Files to Modify**:
- `src/services/content.service.ts`
- `src/services/index.ts`
- `src/hooks/services/use-content-service.ts` (if needed)

**Acceptance Criteria**:
- [ ] ContentService is now a class
- [ ] Methods are instance methods
- [ ] Exported as singleton: `export const contentService = new ContentService()`
- [ ] All existing functionality works unchanged
- [ ] JSDoc comments added following new pattern
- [ ] No breaking changes to consuming code

**Example**:
```typescript
/**
 * Service for handling content and dashboard data.
 * 
 * NOTE: Currently returns demo/placeholder data for dashboard display.
 * Will be implemented with real data persistence in future.
 */
class ContentService {
  /**
   * Get quick access items for dashboard display.
   * @returns Array of quick access items with demo data
   */
  getQuickAccessItems(): QuickAccessItem[] {
    // ... existing implementation
  }
  
  // ... other methods
}

export const contentService = new ContentService();
```

---

### Story 10: Convert sidebar.service.ts to Class Pattern

**Goal**: Convert the sidebar service from object export to class pattern.

**Why This Tenth**: Continue standardization with another utility service.

**Requirements**:
- Convert `sidebar.service.ts` to class-based pattern
- Maintain all current functionality
- Update all imports and usages
- Add comprehensive JSDoc

**Files to Modify**:
- `src/services/sidebar.service.ts`
- `src/services/index.ts`
- Any files importing sidebarService directly

**Acceptance Criteria**:
- [ ] SidebarService is a class
- [ ] Exported as singleton instance
- [ ] All functionality preserved
- [ ] JSDoc comments added
- [ ] No breaking changes

**Testing**:
- [ ] Sidebar navigation still works
- [ ] Sorting and filtering unchanged
- [ ] State management functions correctly

---

### Story 11: Convert header.service.ts to Class Pattern

**Goal**: Convert the header service to class pattern.

**Why This Eleventh**: Complete utility service conversions.

**Requirements**:
- Convert `header.service.ts` to class-based pattern
- Maintain current functionality
- Update imports
- Add JSDoc

**Files to Modify**:
- `src/services/header.service.ts`
- `src/services/index.ts`

**Acceptance Criteria**:
- [ ] HeaderService is a class
- [ ] Singleton export pattern
- [ ] JSDoc comments added
- [ ] No functionality changes

---

### Story 12: Refactor categorization.service.ts Structure

**Goal**: Reorganize categorization service while maintaining its multi-service structure.

**Why This Twelfth**: Handle the most complex service refactoring after building experience.

**Requirements**:
- Keep the sub-service pattern (categoryService, tagService, automationService)
- Ensure consistency with new patterns
- Consider if these should remain object exports (acceptable for grouped services)
- Add comprehensive JSDoc
- Document why this pattern is used

**Files to Modify**:
- `src/services/categorization.service.ts`

**Acceptance Criteria**:
- [ ] Each sub-service is well-documented
- [ ] JSDoc explains the grouped service pattern
- [ ] Comments explain why this pattern was chosen
- [ ] All functionality preserved
- [ ] Usage examples added

**Note**: This service groups related functionality (categories, tags, automations). The object export pattern is acceptable here and documented as an exception.

---

### Story 13: Add Missing Data Hooks

**Goal**: Ensure all major entities have data hooks where appropriate.

**Why This Thirteenth**: Expand hook coverage after standardizing patterns.

**Requirements**:
- Audit all services for missing data hooks
- Create data hooks for: books, highlights, notes (if not present)
- Follow the documented data hook pattern
- Include loading, error, and auth state handling

**Files to Create/Modify**:
- `src/hooks/data/use-books.ts` (if missing)
- `src/hooks/data/use-highlights.ts` (if missing)
- `src/hooks/data/use-notes.ts` (if missing)
- `src/hooks/data/index.ts`

**Acceptance Criteria**:
- [ ] Every major entity has a data hook option
- [ ] All data hooks follow consistent pattern
- [ ] JSDoc comments explain usage
- [ ] Auth state integration included
- [ ] Loading and error states managed

---

### Story 14: Add Consistent Hook Naming Documentation

**Goal**: Document and enforce naming conventions for hooks throughout the codebase.

**Why This Fourteenth**: Establish clear patterns before creating more hooks.

**Requirements**:
- Document the naming convention in HOOK-PATTERN.md
- Create a checklist for new hooks
- Audit existing hooks for naming consistency
- Update any inconsistent names (with deprecation warnings if needed)

**Files to Modify**:
- `docs/architecture/HOOK-PATTERN.md`
- Update any inconsistently named hooks

**Acceptance Criteria**:
- [ ] Clear naming rules documented
  - Service hooks: `useXService()` (returns service instance)
  - Data hooks: `useX()` (returns data with state management)
  - Pattern hooks: `use[Pattern]()` (e.g., `useBaseResource()`)
  - UI hooks: `use[UIState]()` (e.g., `useStorage()`)
- [ ] All existing hooks follow convention or have documented exceptions
- [ ] Checklist added to HOOK-PATTERN.md

---

### Story 15: Add Error Handling Examples Documentation

**Goal**: Create a comprehensive examples document showing error handling in all layers.

**Why This Fifteenth**: Help developers apply error handling consistently.

**Requirements**:
- Create `docs/architecture/ERROR-HANDLING-EXAMPLES.md`
- Show examples for each layer (repository, service, hook, component)
- Include both success and error scenarios
- Document toast notification patterns

**Files to Create**:
- `docs/architecture/ERROR-HANDLING-EXAMPLES.md`

**Acceptance Criteria**:
- [ ] Examples for repository layer
- [ ] Examples for service layer
- [ ] Examples for hook layer
- [ ] Examples for component layer
- [ ] Toast notification patterns documented
- [ ] User-facing error message guidelines

**Content Outline**:
1. Error Handling Philosophy
2. Repository Layer Examples
3. Service Layer Examples
4. Hook Layer Examples
5. Component Layer Examples
6. Toast Notifications
7. User-Facing Messages
8. Debugging Tips

---

### Story 16: Create Testing Patterns Documentation

**Goal**: Document testing strategies for each layer of the architecture.

**Why This Sixteenth**: Enable confident refactoring with good test coverage.

**Requirements**:
- Create `docs/architecture/TESTING-PATTERNS.md`
- Document repository testing patterns
- Document service testing patterns
- Document hook testing patterns
- Include mocking strategies

**Files to Create**:
- `docs/architecture/TESTING-PATTERNS.md`

**Acceptance Criteria**:
- [ ] Repository testing examples
- [ ] Service testing examples
- [ ] Hook testing examples (with React Testing Library)
- [ ] Mocking strategies documented
- [ ] Integration testing guidance
- [ ] Test organization recommendations

---

### Story 17: Add Repository Factory Pattern (Optional Enhancement)

**Goal**: Consider adding a factory pattern for repository creation to ensure consistency.

**Why This Seventeenth**: Enhancement that builds on standardized patterns.

**Requirements**:
- Evaluate if factory pattern would benefit repository creation
- If yes, implement factory in `repositories/index.ts`
- Update documentation
- Consider backward compatibility

**Files to Modify**:
- `src/repositories/index.ts` (potentially)
- Documentation files

**Acceptance Criteria**:
- [ ] Decision documented (implement or not)
- [ ] If implemented, factory pattern documented
- [ ] Migration guide created if breaking changes
- [ ] All repositories work with new pattern

**Note**: This is optional and should be evaluated based on actual pain points encountered during previous stories.

---

### Story 18: Performance Monitoring Setup

**Goal**: Add basic performance monitoring for service layer operations.

**Why This Eighteenth**: Now that patterns are standardized, measure performance.

**Requirements**:
- Add optional performance logging to BaseService
- Create performance monitoring utility
- Add monitoring to key operations
- Document usage

**Files to Create/Modify**:
- `src/lib/performance-monitoring.ts` (new)
- `src/services/base.service.ts`
- Documentation

**Acceptance Criteria**:
- [ ] BaseService methods can be monitored
- [ ] Monitoring is opt-in via configuration
- [ ] Performance data logged to console in dev mode
- [ ] Monitoring doesn't impact production performance
- [ ] Documentation explains how to use

---

### Story 19: Create Architecture Decision Records (ADRs)

**Goal**: Document key architectural decisions for future reference.

**Why This Nineteenth**: Preserve reasoning for architectural choices.

**Requirements**:
- Create `docs/architecture/decisions/` directory
- Document major decisions made during this standardization
- Include context, decision, and consequences
- Follow ADR format

**Files to Create**:
- `docs/architecture/decisions/001-layered-architecture.md`
- `docs/architecture/decisions/002-service-patterns.md`
- `docs/architecture/decisions/003-hook-organization.md`
- `docs/architecture/decisions/README.md`

**Acceptance Criteria**:
- [ ] ADR format documented in README
- [ ] Major decisions recorded
- [ ] Each ADR includes: context, decision, consequences, status
- [ ] ADRs are referenced from main architecture docs

---

### Story 20: Create Developer Onboarding Checklist

**Goal**: Create a checklist for new developers to understand the architecture.

**Why This Twentieth**: Help new team members quickly become productive.

**Requirements**:
- Create onboarding document referencing all pattern docs
- Include reading order for documentation
- Add practical exercises
- Link to real code examples

**Files to Create**:
- `docs/architecture/ONBOARDING.md`

**Acceptance Criteria**:
- [ ] Document lists all architecture docs in reading order
- [ ] Includes practical exercises (e.g., "Create a new repository")
- [ ] Links to real examples in codebase
- [ ] Includes FAQ section
- [ ] Has "Getting Help" section

---

## Story Implementation Guidelines

### For Each Story:

1. **Before Starting**:
   - Read the story requirements completely
   - Review any referenced documentation
   - Check for dependent stories that should be completed first

2. **During Implementation**:
   - Follow the acceptance criteria exactly
   - Write or update tests as needed
   - Add JSDoc comments to new code
   - Update related documentation

3. **Before Completing**:
   - Check all acceptance criteria
   - Run tests
   - Check for linter errors
   - Review changes for consistency with new patterns

4. **After Completing**:
   - Update this document's checkbox for the story
   - Note any lessons learned
   - Document any deviations from the plan

### Notes:

- **Stories 1-8** are documentation-focused and non-disruptive
- **Stories 9-12** refactor existing code to new patterns
- **Stories 13-20** add enhancements and supporting documentation
- Stories can be split or combined based on team capacity
- Some stories (like 17) are optional and can be skipped

## Conclusion

The current architecture is solid and follows good principles. These improvements will enhance consistency, reduce confusion, and make the codebase more maintainable as it grows. Prioritize documentation and gradual migration over disruptive rewrites.

Work through these stories sequentially, completing each one fully before moving to the next. This approach ensures a smooth transition while maintaining system stability.
