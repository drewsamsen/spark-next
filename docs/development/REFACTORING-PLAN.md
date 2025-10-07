# Spark Application Refactoring Plan

**Last Updated:** October 6, 2025  
**Status:** Active Development

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Completed Foundation](#architecture--completed-foundation)
3. [Prioritized Developer Stories](#prioritized-developer-stories)
4. [Completed Major Initiatives](#completed-major-initiatives)
5. [Success Metrics](#success-metrics)

---

## Overview

This document provides the current, consolidated refactoring plan for the Spark application. It organizes remaining work into well-defined, sequential developer stories that can be tackled one at a time.

### Architectural Goals

We're implementing a clean architecture pattern with clear separation of concerns:

- **Repository Layer**: Handles direct database access through Supabase
- **Service Layer**: Implements business logic using repositories
- **React Hooks**: Provides components with access to services
- **Components**: Consume hooks to display UI and handle interactions

**Data Flow:** `repository → service → hook → component`

### Current State

✅ **Foundation Complete:**
- 16 repositories established
- 15 services implemented
- Base classes for repositories and services
- Hook factory pattern (`use-base-resource.ts`)
- Clean architecture pattern in place

🔧 **Ongoing Work:**
- Refining component structure
- Improving directory organization
- Standardizing naming conventions
- Reducing code duplication
- Enhancing error handling

---

## Architecture & Completed Foundation

### Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Components (UI)                       │
│  - Presentation logic                                    │
│  - User interactions                                     │
└──────────────────────┬──────────────────────────────────┘
                       │ uses
┌──────────────────────▼──────────────────────────────────┐
│                 React Hooks Layer                        │
│  - State management                                      │
│  - Loading & error states                                │
│  - Optimistic updates                                    │
└──────────────────────┬──────────────────────────────────┘
                       │ calls
┌──────────────────────▼──────────────────────────────────┐
│                  Service Layer                           │
│  - Business logic                                        │
│  - Data transformation                                   │
│  - Error handling                                        │
└──────────────────────┬──────────────────────────────────┘
                       │ uses
┌──────────────────────▼──────────────────────────────────┐
│                Repository Layer                          │
│  - Database access (Supabase)                            │
│  - Query construction                                    │
│  - Data mapping                                          │
└─────────────────────────────────────────────────────────┘
```

### Completed Foundation Work

#### ✅ Repositories (16 total)
- auth, automations, base, books, categories, categorization
- content, function-logs, highlights, integrations, notes
- sparks, tags, user-settings

#### ✅ Services (15 total)
- airtable, auth, base, books, categorization, content
- function-logs, header, highlights, integrations, notes
- sidebar, sparks, user-settings

#### ✅ Enhanced Hooks
- `use-base-resource.ts` - Hook factory with standardized patterns
- `use-sparks.ts` - Enhanced with loading states
- `use-categorization.ts` - Enhanced with loading states
- `use-auth-session.ts` - Standardized auth state management
- `useSidebarData.ts` - Unified sidebar data loading

#### ✅ Component Refactoring
- **AppLayout**: Reduced from 420 → 185 lines (56% reduction)
- **FunctionLogsTable**: Broken into smaller components
- **BookHighlights**: Using service layer
- **ScheduledTasksTable**: Using service layer
- **NestedSidebar**: Using service layer
- **SparkPreviewPanel**: Using service layer

#### ✅ Documentation
- `.cursor/rules/data-architecture.mdc` - Architecture guidelines
- `docs/architecture/SERVICE-LAYER-OVERVIEW.md` - Implementation overview
- `docs/development/HOOKS-USAGE.md` - Hook usage patterns
- `docs/development/REFACTORING.md` - Historical tracking

---

## Prioritized Developer Stories

### 🔴 Priority 1: Code Organization & Standards (1-2 weeks)

These stories improve maintainability and developer experience by organizing code consistently.

---

#### Story 1.1: Reorganize UI Components into Feature Directories

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Currently, some components are organized by feature (e.g., `components/FunctionLogs/`), but many generic UI components are scattered. We need consistent organization.

**Current State:**
```
src/components/
  - FunctionLogs/           ✅ Good (feature-based)
  - Highlights/             ✅ Good (feature-based)
  - SparkPreview/           ✅ Good (feature-based)
  - ScheduledTasks/         ✅ Good (feature-based)
  - Sidebar/                ✅ Good (feature-based)
  - ui/                     ⚠️ Needs review
  - icons/                  ⚠️ Needs review
  - (other misc files)      ⚠️ Needs organization
```

**Tasks:**
- [ ] Audit all components in `src/components/`
- [ ] Identify components that should move to `ui/`
- [ ] Identify components that should move to `icons/`
- [ ] Create feature directories for related components
- [ ] Move components to appropriate locations
- [ ] Update all imports throughout the codebase

**Acceptance Criteria:**
- [ ] All generic UI components are in `src/components/ui/`
- [ ] All icon components are in `src/components/icons/`
- [ ] Feature-specific components are in their own directories
- [ ] No components loose in `src/components/` root
- [ ] All imports updated and working

**Files to Review:**
```
src/components/
  - Review all *.tsx files not in subdirectories
  - Check for components that should be grouped
```

---

#### Story 1.2: Create Index Files for Component Directories

**Effort:** 1-2 hours  
**Dependencies:** Story 1.1

**Context:**  
Index files simplify imports and make the API surface of each directory clear. This follows the pattern in our file-structure guidelines.

**Example:**
```typescript
// Before
import { FunctionLogsTable } from '@/components/FunctionLogs/FunctionLogsTable';
import { FunctionLogDetails } from '@/components/FunctionLogs/FunctionLogDetails';

// After
import { FunctionLogsTable, FunctionLogDetails } from '@/components/FunctionLogs';
```

**Tasks:**
- [ ] Create `index.ts` for each feature directory in `src/components/`
- [ ] Export all components from each directory
- [ ] Create `index.ts` for `src/components/ui/`
- [ ] Create `index.ts` for `src/components/icons/`
- [ ] Update imports to use directory imports where beneficial

**Acceptance Criteria:**
- [ ] Every component directory has an `index.ts`
- [ ] All components are exported from their directory index
- [ ] Common component imports use directory-level imports

**Files to Create:**
```
src/components/FunctionLogs/index.ts
src/components/Highlights/index.ts
src/components/SparkPreview/index.ts
src/components/ScheduledTasks/index.ts
src/components/Sidebar/index.ts
src/components/ui/index.ts
src/components/icons/index.ts
(and any new feature directories from Story 1.1)
```

---

#### Story 1.3: Standardize Component File Naming (PascalCase)

**Effort:** 2-3 hours  
**Dependencies:** Story 1.1, 1.2

**Context:**  
Some component files use kebab-case (e.g., `nested-sidebar.tsx`), others use PascalCase (e.g., `FunctionLogsTable.tsx`). We should standardize on PascalCase for all component files per our naming conventions.

**Current Issues:**
```
❌ src/components/nested-sidebar.tsx
❌ src/components/book-highlights.tsx
❌ src/components/spark-preview-panel.tsx
✅ src/components/FunctionLogs/FunctionLogsTable.tsx (correct)
```

**Tasks:**
- [ ] Identify all kebab-case component files
- [ ] Rename files to PascalCase
- [ ] Update all imports referencing these files
- [ ] Update index.ts files with new names
- [ ] Verify no broken imports remain

**Acceptance Criteria:**
- [ ] All component files use PascalCase
- [ ] All imports updated
- [ ] Application runs without errors
- [ ] No console warnings about missing modules

**Search Command:**
```bash
# Find all kebab-case component files
find src/components -name "*-*.tsx" -o -name "*-*.ts"
```

---

#### Story 1.4: Reorganize Hooks by Feature

**Effort:** 1-2 hours  
**Dependencies:** None

**Context:**  
Currently, all hooks are in a flat `src/hooks/` directory. While this works, grouping related hooks would improve organization and discoverability.

**Proposed Structure:**
```
src/hooks/
  - index.ts                    # Re-exports all hooks
  - auth/
    - use-auth-session.ts
    - use-supabase-auth.ts
    - index.ts
  - services/
    - use-services.ts
    - use-content-service.ts
    - use-function-logs-service.ts
    - use-notes-service.ts
    - use-sidebar-service.ts
    - use-user-settings-service.ts
    - index.ts
  - data/
    - use-sparks.ts
    - use-categorization.ts
    - use-function-logs.ts
    - use-user-settings.ts
    - index.ts
  - ui/
    - use-storage.ts
    - useSidebarData.ts
    - index.ts
  - patterns/
    - use-base-resource.ts
    - use-realtime-subscription.ts
    - index.ts
  - (deprecated)/
    - useQueryHooks.ts         # Mark for review/removal
```

**Tasks:**
- [ ] Create subdirectories in `src/hooks/`
- [ ] Move hooks to appropriate subdirectories
- [ ] Create index.ts in each subdirectory
- [ ] Update main `src/hooks/index.ts` to re-export all
- [ ] Update imports throughout codebase
- [ ] Mark deprecated hooks for review

**Acceptance Criteria:**
- [ ] Hooks organized by logical grouping
- [ ] Each subdirectory has index.ts
- [ ] Main hooks/index.ts exports all hooks
- [ ] All imports updated and working
- [ ] Deprecated hooks clearly marked

---

#### Story 1.5: Standardize Utility Organization

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
The `src/lib/` directory contains various utilities and services. Some are well-organized (e.g., `categorization/`), but others are scattered. Better organization would improve maintainability.

**Current State:**
```
src/lib/
  - categorization/           ✅ Good (domain-organized)
  - auth/                     ✅ Good (domain-organized)
  - trpc/                     ✅ Good (domain-organized)
  - email/                    ✅ Good (domain-organized)
  - (many loose files)        ⚠️ Needs organization
```

**Proposed Organization:**
```
src/lib/
  - auth/
  - categorization/
  - trpc/
  - email/
  - database/                 # NEW: db.ts, supabase.ts
  - clients/                  # NEW: aiClient.ts
  - utilities/                # NEW: utils.ts, api-utils.ts, error-handling.ts
  - storage/                  # NEW: storage.ts, client-storage.ts
  - types/                    # NEW: types.ts, errors.ts
  - inngest/                  # Keep existing: inngest.ts, inngest-db-logger-middleware.ts
```

**Tasks:**
- [ ] Create new subdirectories
- [ ] Move related files into subdirectories
- [ ] Create index.ts in each subdirectory
- [ ] Update imports throughout codebase
- [ ] Verify no broken imports

**Acceptance Criteria:**
- [ ] Related utilities grouped in subdirectories
- [ ] Each subdirectory has clear purpose
- [ ] Index files for easy imports
- [ ] All imports updated and working

---

### 🟡 Priority 2: Code Quality & Duplication (2-3 weeks)

These stories reduce code duplication and improve code quality through abstraction.

---

#### Story 2.1: Create Reusable Date & Duration Formatting Utilities

**Effort:** 1 hour  
**Dependencies:** None

**Context:**  
Date and duration formatting logic is duplicated across multiple components and hooks, particularly in function logs and display components.

**Current Issues:**
- Date formatting logic in `use-function-logs.ts` and other places
- Duration calculations duplicated
- No standardized approach to time formatting

**Tasks:**
- [ ] Create `src/lib/utilities/date-utils.ts`
- [ ] Extract date formatting functions
- [ ] Extract duration formatting functions
- [ ] Add comprehensive JSDoc comments
- [ ] Update all components/hooks to use new utilities

**Proposed Functions:**
```typescript
// src/lib/utilities/date-utils.ts
export function formatDate(date: Date | string, format?: string): string
export function formatDuration(milliseconds: number): string
export function formatRelativeTime(date: Date | string): string
export function formatTimestamp(date: Date | string): string
```

**Acceptance Criteria:**
- [ ] Utility file created with date/duration functions
- [ ] All duplicate date formatting logic removed
- [ ] Components/hooks use new utilities
- [ ] Functions have JSDoc documentation
- [ ] Consistent formatting across application

**Files to Update:**
```
src/hooks/use-function-logs.ts
src/hooks/use-function-logs-data.ts
src/components/FunctionLogs/FunctionLogDetails.tsx
(Search for date formatting patterns)
```

---

#### Story 2.2: Abstract Table Filtering, Sorting, and Pagination Patterns

**Effort:** 3-4 hours  
**Dependencies:** None

**Context:**  
Multiple table components (FunctionLogsTable, ScheduledTasksTable) implement similar filtering, sorting, and pagination logic. This should be abstracted into reusable hooks.

**Current Duplication:**
- Filtering logic in multiple tables
- Sorting logic duplicated
- Pagination state management repeated

**Tasks:**
- [ ] Create `src/hooks/ui/use-table-filters.ts`
- [ ] Create `src/hooks/ui/use-table-sorting.ts`
- [ ] Create `src/hooks/ui/use-table-pagination.ts`
- [ ] Refactor FunctionLogsTable to use new hooks
- [ ] Refactor ScheduledTasksTable to use new hooks
- [ ] Create documentation with examples

**Proposed API:**
```typescript
// src/hooks/ui/use-table-filters.ts
export function useTableFilters<T>(
  data: T[],
  filterConfig: FilterConfig<T>
): FilteredData<T>

// src/hooks/ui/use-table-sorting.ts
export function useTableSorting<T>(
  data: T[],
  defaultSort?: SortConfig<T>
): SortedData<T>

// src/hooks/ui/use-table-pagination.ts
export function useTablePagination<T>(
  data: T[],
  pageSize?: number
): PaginatedData<T>
```

**Acceptance Criteria:**
- [ ] Reusable hooks created for filtering, sorting, pagination
- [ ] Existing tables refactored to use new hooks
- [ ] Line count reduced in table components
- [ ] Consistent table behavior across app
- [ ] TypeScript types properly defined

---

#### Story 2.3: Create Reusable Table UI Components

**Effort:** 3-4 hours  
**Dependencies:** Story 2.2

**Context:**  
Table components share common UI patterns: loading skeletons, empty states, expansion rows, status badges. These should be abstracted into reusable components.

**Current Duplication:**
- Loading skeleton patterns
- Empty state messages
- Status badge components
- Expandable row logic

**Tasks:**
- [ ] Create `src/components/ui/Table/TableSkeleton.tsx`
- [ ] Create `src/components/ui/Table/TableEmptyState.tsx`
- [ ] Create `src/components/ui/Table/ExpandableRow.tsx`
- [ ] Create `src/components/ui/Table/StatusBadge.tsx`
- [ ] Create `src/components/ui/Table/index.ts`
- [ ] Refactor existing tables to use new components

**Proposed Components:**
```typescript
<TableSkeleton rows={5} columns={4} />
<TableEmptyState message="No data found" icon={<Icon />} />
<ExpandableRow trigger={<button>Expand</button>}>
  {expandedContent}
</ExpandableRow>
<StatusBadge status="success" label="Completed" />
```

**Acceptance Criteria:**
- [ ] Reusable table UI components created
- [ ] Components support customization via props
- [ ] Existing tables refactored to use components
- [ ] Consistent styling using Tailwind
- [ ] Components documented with examples

**Files to Update:**
```
src/components/FunctionLogs/FunctionLogsTable.tsx
src/components/ScheduledTasks/ScheduledTasksTable.tsx
```

---

#### Story 2.4: Create Standardized Search Component

**Effort:** 2 hours  
**Dependencies:** None

**Context:**  
Search inputs appear in multiple places (sidebar, tables) with similar functionality but different implementations. A standardized component would improve consistency.

**Tasks:**
- [ ] Create `src/components/ui/SearchInput.tsx`
- [ ] Support debouncing out of the box
- [ ] Support clear button
- [ ] Support loading state
- [ ] Update components to use new SearchInput

**Proposed API:**
```typescript
<SearchInput
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search..."
  debounceMs={300}
  isLoading={isSearching}
/>
```

**Acceptance Criteria:**
- [ ] Reusable SearchInput component created
- [ ] Built-in debouncing support
- [ ] Clear button included
- [ ] Loading state support
- [ ] Components refactored to use SearchInput
- [ ] Consistent styling with Tailwind

---

#### Story 2.5: Create Standardized Filter Component

**Effort:** 2 hours  
**Dependencies:** None

**Context:**  
Filter dropdowns appear in multiple tables and views with similar patterns. A reusable filter component would improve consistency and reduce duplication.

**Tasks:**
- [ ] Create `src/components/ui/FilterDropdown.tsx`
- [ ] Support single and multi-select
- [ ] Support grouping
- [ ] Support search within filters
- [ ] Update components to use new FilterDropdown

**Proposed API:**
```typescript
<FilterDropdown
  options={filterOptions}
  value={selectedFilter}
  onChange={setFilter}
  placeholder="Filter by..."
  multiple={false}
/>
```

**Acceptance Criteria:**
- [ ] Reusable FilterDropdown component created
- [ ] Single and multi-select support
- [ ] Search within options
- [ ] Keyboard navigation support
- [ ] Components refactored to use FilterDropdown

---

### 🟢 Priority 3: Enhanced Hooks & State Management (3-4 weeks)

These stories improve the hook layer with consistent patterns and better state management.

---

#### Story 3.1: Implement Enhanced Hooks for Books Service

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
The books service has basic hooks, but they should be enhanced with loading states, error handling, and optimistic updates following the pattern established in `use-sparks.ts` and `use-categorization.ts`.

**Current State:**
- Basic service integration exists
- Missing standardized loading states
- Missing optimistic updates for mutations
- Error handling not standardized

**Tasks:**
- [ ] Review existing books hooks
- [ ] Add loading and error states
- [ ] Implement optimistic updates for mutations
- [ ] Add toast notifications for success/error
- [ ] Subscribe to auth state changes
- [ ] Add JSDoc documentation

**Pattern to Follow:**
```typescript
// Reference: src/hooks/use-sparks.ts
export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load data
  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    // ... implementation
  }, []);
  
  // Mutations with optimistic updates
  const updateBook = useCallback(async (id: string, updates: Partial<Book>) => {
    // Optimistic update
    // API call
    // Revert on error
    // Toast notification
  }, []);
  
  return { books, isLoading, error, loadBooks, updateBook, ... };
}
```

**Acceptance Criteria:**
- [ ] Enhanced hooks implemented for books
- [ ] Loading states properly managed
- [ ] Error states with user feedback
- [ ] Optimistic updates for all mutations
- [ ] Auth state change subscription
- [ ] Consistent with sparks/categorization pattern

---

#### Story 3.2: Implement Enhanced Hooks for Highlights Service

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Similar to books, highlights hooks need enhancement with proper loading states, error handling, and optimistic updates.

**Tasks:**
- [ ] Review existing highlights hooks
- [ ] Add loading and error states
- [ ] Implement optimistic updates for mutations
- [ ] Add toast notifications for success/error
- [ ] Subscribe to auth state changes
- [ ] Add JSDoc documentation

**Acceptance Criteria:**
- [ ] Enhanced hooks implemented for highlights
- [ ] Loading states properly managed
- [ ] Error states with user feedback
- [ ] Optimistic updates for all mutations
- [ ] Auth state change subscription
- [ ] Consistent with established patterns

---

#### Story 3.3: Implement Enhanced Hooks for Notes Service

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Notes service needs enhanced hooks following the established pattern.

**Tasks:**
- [ ] Review existing notes hooks
- [ ] Add loading and error states
- [ ] Implement optimistic updates for mutations
- [ ] Add toast notifications for success/error
- [ ] Subscribe to auth state changes
- [ ] Add JSDoc documentation

**Acceptance Criteria:**
- [ ] Enhanced hooks implemented for notes
- [ ] Loading states properly managed
- [ ] Error states with user feedback
- [ ] Optimistic updates for all mutations
- [ ] Auth state change subscription

---

#### Story 3.4: Standardize Error Handling Across All Hooks

**Effort:** 3-4 hours  
**Dependencies:** Stories 3.1, 3.2, 3.3

**Context:**  
After enhancing all service hooks, we should ensure error handling is completely consistent across all hooks with standardized error types and user feedback.

**Tasks:**
- [ ] Audit all hooks for error handling patterns
- [ ] Create standardized error handling utility
- [ ] Update all hooks to use standard error handling
- [ ] Ensure consistent toast notifications
- [ ] Add error logging where appropriate
- [ ] Document error handling pattern

**Proposed Utility:**
```typescript
// src/lib/utilities/error-handling.ts
export function handleHookError(
  error: Error,
  context: string,
  showToast: boolean = true
): void
```

**Acceptance Criteria:**
- [ ] All hooks use consistent error handling
- [ ] Standardized error messages
- [ ] Consistent toast notification patterns
- [ ] Error logging for debugging
- [ ] Documentation updated

---

#### Story 3.5: Implement Retry Logic for Network Requests

**Effort:** 2-3 hours  
**Dependencies:** Story 3.4

**Context:**  
Network requests should have automatic retry logic with exponential backoff to improve resilience against transient failures.

**Tasks:**
- [ ] Create retry utility in `src/lib/utilities/`
- [ ] Implement exponential backoff
- [ ] Add configurable retry attempts
- [ ] Integrate with service layer
- [ ] Test with intentional failures

**Proposed API:**
```typescript
// src/lib/utilities/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>
```

**Acceptance Criteria:**
- [ ] Retry utility created with exponential backoff
- [ ] Configurable retry attempts and delays
- [ ] Integrated into service layer
- [ ] Does not retry on 4xx errors (only 5xx and network errors)
- [ ] Documented with examples

---

### 🔵 Priority 4: Testing & Performance (4+ weeks)

These stories add testing infrastructure and improve performance.

---

#### Story 4.1: Implement Unit Tests for Repositories

**Effort:** 1 week  
**Dependencies:** None

**Context:**  
Repositories should have comprehensive unit tests to ensure database operations work correctly. This prevents regressions as we continue refactoring.

**Tasks:**
- [ ] Set up testing infrastructure (Jest/Vitest)
- [ ] Create test fixtures and mocks for Supabase
- [ ] Write tests for base.repository.ts
- [ ] Write tests for each repository
- [ ] Achieve >80% code coverage for repositories
- [ ] Document testing patterns

**Acceptance Criteria:**
- [ ] Testing framework configured
- [ ] Mock utilities for Supabase created
- [ ] Each repository has test file
- [ ] >80% code coverage for repositories
- [ ] Tests run in CI/CD pipeline

---

#### Story 4.2: Implement Unit Tests for Services

**Effort:** 1 week  
**Dependencies:** Story 4.1

**Context:**  
Services contain business logic that should be thoroughly tested. Tests should mock repositories and verify service logic.

**Tasks:**
- [ ] Create mocks for repositories
- [ ] Write tests for base.service.ts
- [ ] Write tests for each service
- [ ] Test error handling paths
- [ ] Achieve >80% code coverage for services
- [ ] Document testing patterns

**Acceptance Criteria:**
- [ ] Each service has test file
- [ ] Repository mocks created
- [ ] Business logic thoroughly tested
- [ ] >80% code coverage for services
- [ ] Tests run in CI/CD pipeline

---

#### Story 4.3: Implement Unit Tests for Custom Hooks

**Effort:** 1 week  
**Dependencies:** Story 4.2

**Context:**  
Custom hooks should be tested to ensure they properly manage state and integrate with services.

**Tasks:**
- [ ] Set up React Testing Library
- [ ] Create mocks for services
- [ ] Write tests for base hook factory
- [ ] Write tests for each custom hook
- [ ] Test loading and error states
- [ ] Test optimistic updates
- [ ] Achieve >80% code coverage

**Acceptance Criteria:**
- [ ] React Testing Library configured
- [ ] Each hook has test file
- [ ] State management thoroughly tested
- [ ] >80% code coverage for hooks
- [ ] Tests run in CI/CD pipeline

---

#### Story 4.4: Add End-to-End Tests for Critical Flows

**Effort:** 1-2 weeks  
**Dependencies:** None

**Context:**  
Critical user flows should have E2E tests to prevent regressions and ensure the application works as expected from a user's perspective.

**Critical Flows to Test:**
1. Authentication (sign in, sign out)
2. Import highlights from Readwise
3. Categorize sparks/highlights
4. Search and filter data
5. Create and edit notes
6. Manage categories and tags

**Tasks:**
- [ ] Set up E2E testing framework (Playwright/Cypress)
- [ ] Create test utilities and helpers
- [ ] Write tests for authentication flow
- [ ] Write tests for import flow
- [ ] Write tests for categorization flow
- [ ] Write tests for search/filter
- [ ] Write tests for notes CRUD
- [ ] Configure E2E tests in CI/CD

**Acceptance Criteria:**
- [ ] E2E framework configured
- [ ] All critical flows have E2E tests
- [ ] Tests run in CI environment
- [ ] Tests run on every PR
- [ ] Test failures block merging

---

#### Story 4.5: Optimize Database Queries

**Effort:** 1 week  
**Dependencies:** Story 4.1

**Context:**  
Some database queries, especially those with complex joins and filters, could be optimized for better performance.

**Tasks:**
- [ ] Audit all repository methods for query efficiency
- [ ] Identify N+1 query problems
- [ ] Add appropriate indexes (work with backend team)
- [ ] Optimize complex joins
- [ ] Add query performance monitoring
- [ ] Document query optimization patterns

**Acceptance Criteria:**
- [ ] All queries reviewed for efficiency
- [ ] N+1 problems resolved
- [ ] Indexes added where needed
- [ ] Complex queries optimized
- [ ] Performance improvements measurable

---

#### Story 4.6: Implement React Rendering Optimizations

**Effort:** 1 week  
**Dependencies:** None

**Context:**  
Some components may have unnecessary re-renders. We should identify and optimize these with React.memo, useMemo, and useCallback.

**Tasks:**
- [ ] Install React DevTools Profiler
- [ ] Profile application to identify re-render issues
- [ ] Apply React.memo to appropriate components
- [ ] Use useMemo for expensive calculations
- [ ] Use useCallback for event handlers
- [ ] Measure improvement
- [ ] Document optimization patterns

**Acceptance Criteria:**
- [ ] Re-render issues identified and documented
- [ ] Optimizations applied where beneficial
- [ ] Performance improvements measured
- [ ] No over-optimization (keep code readable)
- [ ] Guidelines documented

---

### 🟣 Priority 5: Frontend Structure & Next.js Best Practices (4+ weeks)

These stories ensure we're following Next.js App Router best practices.

---

#### Story 5.1: Implement loading.tsx for Route Loading States

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Next.js App Router supports `loading.tsx` files for route-level loading states. We should implement these for routes that load data.

**Routes Needing loading.tsx:**
- `/highlights/[rwId]`
- `/notes/[id]`
- `/category/[slug]`
- `/tag/[name]`
- `/dashboard`

**Tasks:**
- [ ] Create loading.tsx for highlights route
- [ ] Create loading.tsx for notes route
- [ ] Create loading.tsx for category route
- [ ] Create loading.tsx for tag route
- [ ] Create loading.tsx for dashboard
- [ ] Use consistent loading UI (skeletons)

**Acceptance Criteria:**
- [ ] All data-loading routes have loading.tsx
- [ ] Loading states are consistent
- [ ] User sees immediate feedback during navigation
- [ ] Loading skeletons match actual content layout

---

#### Story 5.2: Implement error.tsx for Error Boundaries

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Next.js App Router supports `error.tsx` files for route-level error boundaries. We should implement these to gracefully handle errors.

**Routes Needing error.tsx:**
- All routes with loading.tsx
- Any route that could encounter errors

**Tasks:**
- [ ] Create reusable error UI component
- [ ] Implement error.tsx for key routes
- [ ] Add error logging/reporting
- [ ] Add "Try Again" functionality
- [ ] Test with intentional errors

**Acceptance Criteria:**
- [ ] All key routes have error.tsx
- [ ] Errors are caught and displayed gracefully
- [ ] Error details logged for debugging
- [ ] Users can recover from errors
- [ ] Consistent error UI across routes

---

#### Story 5.3: Optimize Client vs Server Component Usage

**Effort:** 1 week  
**Dependencies:** None

**Context:**  
We should maximize the use of Server Components for better performance and smaller client bundles, only using Client Components when necessary.

**Tasks:**
- [ ] Audit all components for "use client" directive
- [ ] Identify components that could be Server Components
- [ ] Refactor components to Server Components where possible
- [ ] Ensure proper data fetching in Server Components
- [ ] Measure bundle size improvement
- [ ] Document Server vs Client Component guidelines

**Acceptance Criteria:**
- [ ] Unnecessary "use client" directives removed
- [ ] Server Components used where possible
- [ ] Client bundle size reduced
- [ ] No loss of functionality
- [ ] Guidelines documented

---

#### Story 5.4: Implement Proper Metadata for SEO

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Next.js App Router supports metadata API for SEO. We should implement proper metadata for all routes.

**Tasks:**
- [ ] Create metadata utilities
- [ ] Add metadata to layout.tsx files
- [ ] Add metadata to page.tsx files
- [ ] Implement dynamic metadata for dynamic routes
- [ ] Add Open Graph tags
- [ ] Test with SEO tools

**Acceptance Criteria:**
- [ ] All routes have proper metadata
- [ ] Dynamic routes have dynamic metadata
- [ ] Open Graph tags implemented
- [ ] SEO scores improved
- [ ] Metadata utilities documented

---

#### Story 5.5: Review and Optimize Routing Structure

**Effort:** 3-4 hours  
**Dependencies:** None

**Context:**  
Review the current routing structure to ensure it follows Next.js App Router best practices and provides good UX.

**Tasks:**
- [ ] Audit current routing structure
- [ ] Identify opportunities for route groups
- [ ] Identify opportunities for parallel routes
- [ ] Review nested layouts
- [ ] Document routing decisions
- [ ] Implement any structural improvements

**Acceptance Criteria:**
- [ ] Routing structure follows App Router best practices
- [ ] Route groups used appropriately
- [ ] Layouts properly nested
- [ ] Routing documented in README

---

### 🟤 Priority 6: Additional Improvements (Ongoing)

These stories are lower priority but still valuable improvements.

---

#### Story 6.1: Add Comprehensive JSDoc Comments

**Effort:** Ongoing  
**Dependencies:** None

**Context:**  
Functions, classes, and types should have JSDoc comments for better IDE support and documentation.

**Tasks:**
- [ ] Add JSDoc to all repository methods
- [ ] Add JSDoc to all service methods
- [ ] Add JSDoc to all custom hooks
- [ ] Add JSDoc to utility functions
- [ ] Add JSDoc to type definitions

**Acceptance Criteria:**
- [ ] All public APIs have JSDoc comments
- [ ] JSDoc includes parameter descriptions
- [ ] JSDoc includes return type descriptions
- [ ] JSDoc includes usage examples where helpful

---

#### Story 6.2: Review and Improve Accessibility

**Effort:** 1 week  
**Dependencies:** None

**Context:**  
Ensure the application follows accessibility best practices (WCAG 2.1 AA).

**Tasks:**
- [ ] Run accessibility audit tools
- [ ] Implement keyboard navigation for all interactive elements
- [ ] Add proper ARIA labels
- [ ] Ensure proper color contrast
- [ ] Test with screen readers
- [ ] Document accessibility patterns

**Acceptance Criteria:**
- [ ] Application passes accessibility audits
- [ ] Full keyboard navigation support
- [ ] Proper ARIA labels throughout
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible

---

#### Story 6.3: Implement Consistent Keyboard Navigation

**Effort:** 3-4 days  
**Dependencies:** Story 6.2

**Context:**  
All interactive components should support keyboard navigation with intuitive shortcuts.

**Tasks:**
- [ ] Define keyboard shortcuts
- [ ] Implement navigation shortcuts
- [ ] Implement action shortcuts
- [ ] Add keyboard shortcut help modal
- [ ] Document shortcuts

**Acceptance Criteria:**
- [ ] All components support keyboard navigation
- [ ] Shortcuts are intuitive and consistent
- [ ] Help modal shows all shortcuts
- [ ] Shortcuts documented

---

---

## Completed Major Initiatives

These significant refactoring efforts have been completed and documented here for reference.

### ✅ AppLayout Refactoring

**Completed:** October 2025

**Achievement:**
- Reduced from 420 lines → 185 lines (56% reduction)
- Created SidebarContext for centralized state management
- Created useSidebarData hook for unified data loading
- Simplified from 7 useEffects → 1 useEffect
- Removed redundant standalone hooks

**Documentation:** See archived `app-layout-refactoring-plan.md`

---

### ✅ Repository-Service-Hook Pattern Foundation

**Completed:** September-October 2025

**Achievement:**
- Established 16 repositories
- Created 15 services
- Implemented base.repository.ts and base.service.ts
- Created hook factory pattern (use-base-resource.ts)
- Refactored all API routes to use services

**Documentation:** See `docs/architecture/SERVICE-LAYER-OVERVIEW.md`

---

### ✅ Type Safety Improvements

**Completed:** September 2025

**Achievement:**
- Created comprehensive type definitions in `src/lib/types.ts`
- Replaced `any` types throughout codebase
- Implemented proper interfaces for all models
- Created union types for status enums
- Added JSDoc comments to type definitions

---

### ✅ Component Decomposition

**Completed:** September-October 2025

**Achievement:**
- Broke down FunctionLogsTable into smaller components
- Broke down NestedSidebar into focused components
- Broke down BookHighlights into smaller pieces
- Created feature-based component directories
- Improved component reusability

---

---

## Success Metrics

### Code Quality Metrics

- **Component Size:** Average component < 200 lines ✅
- **Service Coverage:** All database access through repositories ✅
- **Type Safety:** < 5 `any` types in application code ✅
- **Hook Pattern:** All data hooks follow standard pattern (80% complete)

### Organizational Metrics

- **Directory Structure:** All components organized by feature/type (70% complete)
- **Naming Consistency:** All files follow naming conventions (60% complete)
- **Documentation:** All major patterns documented ✅

### Testing Metrics (Future)

- **Unit Test Coverage:** >80% for repositories and services
- **E2E Test Coverage:** All critical flows covered
- **Test Reliability:** <5% flaky test rate

### Performance Metrics (Future)

- **Bundle Size:** Reduce client JS by 20%
- **Load Time:** <2s initial page load
- **Rendering:** No unnecessary re-renders in key components

---

## How to Use This Document

1. **Pick a Story:** Choose a story based on priority and dependencies
2. **Read Context:** Understand why the work is needed
3. **Check Dependencies:** Ensure dependent stories are complete
4. **Follow Tasks:** Work through tasks in order
5. **Verify Acceptance Criteria:** Ensure all criteria are met
6. **Mark Complete:** Check off story when done
7. **Update Document:** Keep this document current

---

## Notes

- This is a living document - update it as work progresses
- Add new stories as needs are identified
- Archive completed stories to keep document focused
- Adjust priorities based on business needs

---

**Last Updated:** October 6, 2025  
**Next Review:** Weekly during active refactoring

