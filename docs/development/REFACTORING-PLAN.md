# Spark Application Refactoring Plan

**Last Updated:** October 7, 2025  
**Status:** Active Development - Recently Reviewed and Enhanced

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

### Overview & Recent Updates

**Last Major Update:** October 7, 2025

This refactoring plan has been comprehensively reviewed and updated to reflect the current state of the codebase. Key findings from the review:

**Good News:**
- ✅ Component organization is already excellent (90% complete)
- ✅ Repository-Service-Hook pattern fully implemented
- ✅ Most components already use PascalCase naming
- ✅ Feature-based directory structure is well established
- ✅ Error handling infrastructure exists

**Critical Gaps Identified:**
- ❌ **No `loading.tsx` files** - Pages handle loading internally (suboptimal)
- ❌ **No `error.tsx` files** - No error boundaries for graceful error handling
- ❌ **All pages are client components** - Missing Next.js App Router performance benefits
- ⚠️ **Deprecated code** - Legacy services and methods still present
- ⚠️ **Index files incomplete** - Many directories missing complete exports

**Strategic Priorities:**
1. **Priority 0** (NEW): Clean up deprecated code to prevent confusion
2. **Priority 1**: Complete organization work (reduced scope - mostly verification now)
3. **Priority 2**: Continue with table/UI abstractions
4. **Priority 2.5** (NEW): Improve context and state management
5. **Priority 3**: Enhanced hooks (mostly on track)
6. **Priority 4**: Testing and performance
7. **Priority 4.5** (NEW): API layer consistency
8. **Priority 5**: Next.js best practices (CRITICAL - major gaps identified)
9. **Priority 6**: Accessibility and final polish

**Recommended Starting Point:**
Start with **Priority 0 stories** (2-3 days) to clean up technical debt, then proceed to **Priority 5 stories** (loading/error/server components) as these provide immediate user experience improvements.

---

### 🔴 Priority 0: Critical Cleanup & Technical Debt (2-3 days)

These stories remove deprecated code and clean up technical debt that could cause confusion or bugs.

---

#### ✅ Story 0.1: Remove Deprecated Legacy Services [COMPLETED]

**Effort:** 1 hour  
**Dependencies:** None  
**Completed:** October 7, 2025

**Context:**  
The codebase contains deprecated legacy service files (`books-service.ts`, `sparks-service.ts`) that wrap the new service layer. These should be removed to prevent confusion and ensure all code uses the new architecture.

**What Was Done:**
- Found 2 files importing `Tag` type from `@/lib/books-service`
- Updated `src/components/Highlights/HighlightCard.tsx` to use `HighlightTag` from `@/lib/types`
- Updated `src/components/Highlights/utils.ts` to use `HighlightTag` from `@/lib/types`
- Simplified `renderTag` function (no longer needs to handle flexible tag formats)
- Deleted `src/lib/books-service.ts`
- Deleted `src/lib/sparks-service.ts`
- Verified no linter errors

**Acceptance Criteria:**
- [x] No imports of `@/lib/books-service` or `@/lib/sparks-service`
- [x] Legacy service files deleted
- [x] All code uses proper types from `@/lib/types`
- [x] No linter errors

---

#### Story 0.2: Remove Unused/Deprecated Hooks

**Effort:** 30 minutes  
**Dependencies:** None

**Context:**  
The file `useQueryHooks.ts` contains only an example query that isn't used anywhere. This should be removed to reduce clutter.

**Tasks:**
- [ ] Verify `useQueryHooks` is not imported anywhere
- [ ] Delete `src/hooks/useQueryHooks.ts`
- [ ] Update `src/hooks/index.ts` if it exports this hook
- [ ] Verify application still works

**Acceptance Criteria:**
- [ ] `useQueryHooks.ts` deleted
- [ ] No broken imports
- [ ] Application runs without errors

---

#### Story 0.3: Clean Up Deprecated Repository Methods

**Effort:** 1 hour  
**Dependencies:** None

**Context:**  
Some repositories have `@deprecated` methods that wrap base repository methods (e.g., `deleteBook`, `deleteSpark`). These should be removed in favor of the base methods.

**Current Issues:**
```typescript
// In books.repository.ts
@deprecated Use delete() from BaseRepository instead
async deleteBook(bookId: string): Promise<void>

// In sparks.repository.ts  
@deprecated Use delete() from BaseRepository instead
async deleteSpark(sparkId: string): Promise<void>
```

**Tasks:**
- [ ] Search for usages of deprecated repository methods
- [ ] Update usages to use base methods
- [ ] Remove deprecated methods from repositories
- [ ] Verify all tests pass (when tests exist)

**Acceptance Criteria:**
- [ ] All deprecated methods removed
- [ ] Code uses base repository methods
- [ ] No broken functionality

---

### 🔴 Priority 1: Code Organization & Standards (2-3 days)

These stories improve maintainability and developer experience by organizing code consistently.

**NOTE:** After thorough codebase review, this priority has been significantly reduced in scope. Most organization work is already done! These stories are now primarily verification and completion tasks.

---

#### Story 1.1: Reorganize UI Components into Feature Directories

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Currently, some components are organized by feature (e.g., `components/FunctionLogs/`), but many generic UI components are scattered. We need consistent organization.

**Current State:**
```
src/components/
  - auth/                   ✅ Good (feature-based)
  - debug/                  ⚠️ Empty directory - should remove or populate
  - FunctionLogs/           ✅ Good (feature-based)
  - Highlights/             ✅ Good (feature-based)
  - icons/                  ✅ Good (has index.ts)
  - integrations/           ✅ Good (feature-based)
  - Layout/                 ✅ Good (feature-based)
  - layouts/                ⚠️ Empty - consolidate with Layout/
  - Providers/              ✅ Good (feature-based)
  - ScheduledTasks/         ✅ Good (feature-based)
  - Sidebar/                ✅ Good (feature-based)
  - SparkPreview/           ✅ Good (feature-based)
  - theme/                  ✅ Good (feature-based)
  - ui/                     ⚠️ Has index.ts but incomplete exports
```

**Note:** Most components are already well-organized! The main work is completing index files and cleaning up empty directories.

**Tasks:**
- [ ] Remove empty `src/components/debug/` directory
- [ ] Remove empty `src/components/layouts/` directory  
- [ ] Complete UI components index exports (see Story 1.2)
- [ ] Verify all feature directories have proper organization
- [ ] Document the component organization structure

**Acceptance Criteria:**
- [ ] No empty directories in `src/components/`
- [ ] All feature-specific components are in their own directories
- [ ] Component structure is documented
- [ ] Directory structure is clean and intuitive

**Note:** This story is mostly verification since organization is already good!

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
- [ ] Complete `src/components/ui/index.ts` exports (currently incomplete)
- [ ] Create `src/components/auth/index.ts`
- [ ] Create `src/components/integrations/index.ts`
- [ ] Create `src/components/Layout/index.ts` (exists but may be incomplete)
- [ ] Create `src/components/Providers/index.ts` (exists but verify completeness)
- [ ] Create `src/components/theme/index.ts`
- [ ] Update imports to use directory imports where beneficial

**Acceptance Criteria:**
- [ ] Every component directory has a complete `index.ts`
- [ ] All components are exported from their directory index
- [ ] Common component imports use directory-level imports
- [ ] Import statements are cleaner and more maintainable

**Existing Index Files (verify completeness):**
```
✅ src/components/FunctionLogs/index.ts
✅ src/components/Highlights/index.ts
✅ src/components/SparkPreview/index.ts
✅ src/components/ScheduledTasks/index.ts
✅ src/components/Sidebar/index.ts
⚠️ src/components/ui/index.ts (incomplete)
✅ src/components/icons/index.ts
⚠️ src/components/Layout/index.ts (verify completeness)
⚠️ src/components/Providers/index.ts (verify completeness)
```

**Files to Create:**
```
src/components/auth/index.ts
src/components/integrations/index.ts
src/components/theme/index.ts
```

---

#### Story 1.3: Standardize Component File Naming (PascalCase)

**Effort:** 30 minutes  
**Dependencies:** Story 1.1, 1.2

**Context:**  
After reviewing the codebase, almost all component files already use PascalCase! This story is minimal verification work.

**Current State:**
```
✅ All components in feature directories use PascalCase
✅ Layout components use PascalCase
✅ UI components use PascalCase (kebab-case, lowercase are from shadcn/ui)
✅ Only type/utility files use kebab-case (appropriate)
```

**Tasks:**
- [ ] Verify all component files (files with JSX/TSX exported components) use PascalCase
- [ ] Document that utility/type files can use kebab-case
- [ ] Ensure new components follow PascalCase convention

**Acceptance Criteria:**
- [ ] All React component files use PascalCase
- [ ] Type/utility files appropriately use kebab-case
- [ ] Naming convention is documented
- [ ] Application runs without errors

**Note:** This story is mostly verification - the codebase already follows good naming conventions!

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
  - __legacy__/                 # NEW: For hooks pending removal
    - (empty initially, add hooks being phased out)
```

**Tasks:**
- [ ] Create subdirectories in `src/hooks/`
- [ ] Move hooks to appropriate subdirectories
- [ ] Create index.ts in each subdirectory
- [ ] Update main `src/hooks/index.ts` to re-export all
- [ ] Update imports throughout codebase
- [ ] Create `__legacy__/` directory for hooks being phased out

**Acceptance Criteria:**
- [ ] Hooks organized by logical grouping
- [ ] Each subdirectory has index.ts
- [ ] Main hooks/index.ts exports all hooks
- [ ] All imports updated and working
- [ ] Legacy directory exists for deprecated hooks (if any)

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
  - auth/                     ✅ Already organized
  - categorization/           ✅ Already organized
  - trpc/                     ✅ Already organized
  - email/                    ✅ Already organized
  - zod/                      ✅ Already organized
  - database/                 # NEW: db.ts, supabase.ts
  - clients/                  # NEW: aiClient.ts
  - utilities/                # NEW: utils.ts, api-utils.ts, sidebar-utils.tsx
  - error-handling/           # NEW: error-handling.ts, errors.ts (already good standalone)
  - storage/                  # NEW: storage.ts, client-storage.ts
  - types/                    # NEW: types.ts (or keep at root for easy access)
  - __legacy__/               # NEW: For deprecated files (books-service.ts, sparks-service.ts after removal)
  
  Keep at root level:
  - inngest.ts               # Inngest initialization
  - inngest-db-logger-middleware.ts  # Inngest-specific
  - types.ts                 # Core types used everywhere (or move to types/)
```

**Note:** Consider keeping `types.ts` and `errors.ts` at lib root for easy access, as they're used throughout the app.

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

### 🟠 Priority 2.5: Context & State Management Improvements (1 week)

These stories improve state management and reduce prop drilling through better context usage.

---

#### Story 2.6: Extract Focus Mode to Context

**Effort:** 2 hours  
**Dependencies:** None

**Context:**  
Focus mode is currently managed as local state in `AppLayout.tsx` and doesn't integrate with the sidebar context. This creates inconsistencies and makes it harder to manage layout state holistically.

**Current Issues:**
- Focus mode state is separate from sidebar state
- Toggling focus mode doesn't update sidebar context
- Cannot persist focus mode preference
- Difficult to access focus mode state from child components

**Tasks:**
- [ ] Add focus mode state to `sidebar-context.tsx`
- [ ] Add `toggleFocusMode` action to context
- [ ] Update `AppLayout.tsx` to use context for focus mode
- [ ] Consider persisting focus mode preference to localStorage
- [ ] Update any components that might benefit from knowing focus mode state

**Acceptance Criteria:**
- [ ] Focus mode managed by sidebar context
- [ ] Focus mode state accessible throughout app
- [ ] Layout state is holistic and consistent
- [ ] Consider localStorage persistence (optional enhancement)

---

#### Story 2.7: Consolidate Authentication Hooks

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
There are two similar authentication hooks: `useAuthSession` and `useSupabaseAuth`. They serve similar purposes but have subtle differences. This creates confusion about which to use.

**Current Hooks:**
```typescript
// use-auth-session.ts - uses authService
export function useAuthSession()

// use-supabase-auth.ts - uses Supabase directly
export function useSupabaseAuth()
```

**Tasks:**
- [ ] Audit all usages of both hooks
- [ ] Determine if both are needed or if one can be removed
- [ ] If both needed, document clear use cases for each
- [ ] Consider renaming for clarity (e.g., `useAuthService` vs `useSupabaseSession`)
- [ ] Update documentation with guidance on which to use when

**Acceptance Criteria:**
- [ ] Clear distinction between hooks (or one removed)
- [ ] Documentation explains when to use each
- [ ] No duplicate functionality
- [ ] Consistent usage across codebase

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

### 🔵 Priority 4.5: API Layer Improvements (1 week)

These stories improve consistency and error handling in the API layer.

---

#### Story 4.7: Standardize API Route Authentication

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Some API routes use `authenticateRequest` utility, others implement custom auth checks. This should be standardized for consistency and security.

**Current State:**
```typescript
// Some routes use utility
const { user, error: authError } = await authenticateRequest(request);

// Others have custom implementation
const authHeader = request.headers.get('Authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Tasks:**
- [ ] Audit all API routes for authentication patterns
- [ ] Standardize on `authenticateRequest` utility
- [ ] Update routes with custom auth to use utility
- [ ] Document API authentication pattern
- [ ] Consider middleware for automatic auth on protected routes

**Acceptance Criteria:**
- [ ] All protected API routes use standard auth utility
- [ ] No custom auth implementations
- [ ] Consistent error responses
- [ ] Documentation updated

---

#### Story 4.8: Standardize API Response Format

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
API responses use various formats. Some return data directly, others wrap in objects. Standardizing this improves consistency and makes client-side handling easier.

**Current Variations:**
```typescript
// Direct data return
return NextResponse.json(data);

// Success/error format
return NextResponse.json({ success: true, data });

// Using utility
return createSuccessResponse(data, 'Success message');
```

**Tasks:**
- [ ] Define standard API response format
- [ ] Update `api-utils.ts` with response utilities
- [ ] Audit all API routes
- [ ] Standardize response format across all routes
- [ ] Document API response standards

**Proposed Standard:**
```typescript
// Success
{ success: true, data: T, message?: string }

// Error
{ success: false, error: string, details?: any }
```

**Acceptance Criteria:**
- [ ] All API routes use standard response format
- [ ] Response utilities handle standard format
- [ ] Client code expects standard format
- [ ] Documentation includes response format

---

### 🟣 Priority 5: Frontend Structure & Next.js Best Practices (4+ weeks)

These stories ensure we're following Next.js App Router best practices.

---

#### Story 5.1: Implement loading.tsx for Route Loading States

**Effort:** 3-4 hours  
**Dependencies:** None

**Context:**  
Next.js App Router supports `loading.tsx` files for route-level loading states. Currently, NO routes have loading.tsx files, and pages handle loading internally. This should be improved for better UX.

**Current State:**
- ❌ No loading.tsx files exist
- ⚠️ Pages use client-side loading states (less optimal)
- ⚠️ No streaming or Suspense boundaries

**Routes Needing loading.tsx:**
- `/highlights/[rwId]` - Currently shows loading spinner in component
- `/notes/[id]` - Currently shows loading spinner in component
- `/notes` - List page with loading
- `/category/[slug]` - Currently shows loading spinner in component
- `/tag/[name]` - Currently shows loading spinner in component
- `/` (dashboard) - Currently shows loading spinner in component
- `/automations` - Large page with loading needs

**Tasks:**
- [ ] Create reusable skeleton components for common layouts
- [ ] Create `app/loading.tsx` for root loading (fallback)
- [ ] Create `app/highlights/[rwId]/loading.tsx`
- [ ] Create `app/notes/loading.tsx` and `app/notes/[id]/loading.tsx`
- [ ] Create `app/category/[slug]/loading.tsx`
- [ ] Create `app/tag/[name]/loading.tsx`
- [ ] Create `app/automations/loading.tsx`
- [ ] Update pages to remove internal loading spinners where appropriate
- [ ] Test navigation between routes to see loading states

**Acceptance Criteria:**
- [ ] All data-loading routes have loading.tsx
- [ ] Loading states are consistent and match content layout
- [ ] User sees immediate feedback during navigation
- [ ] Loading skeletons match actual content layout
- [ ] No flash of empty content during navigation

---

#### Story 5.2: Implement error.tsx for Error Boundaries

**Effort:** 3-4 hours  
**Dependencies:** None

**Context:**  
Next.js App Router supports `error.tsx` files for route-level error boundaries. Currently, NO error.tsx files exist. Pages handle errors internally or show uncaught errors. This should be improved.

**Current State:**
- ❌ No error.tsx files exist anywhere
- ⚠️ Uncaught errors break the entire app
- ⚠️ No graceful error handling for route-level failures
- ✅ ErrorState component exists in `ui/` but not used as error boundary

**Routes Needing error.tsx:**
- `/` - Root level error boundary
- `/highlights/[rwId]`
- `/notes/[id]` and `/notes`
- `/category/[slug]`
- `/tag/[name]`
- `/automations`
- `/debug` and `/settings`

**Tasks:**
- [ ] Review existing `ErrorState` component in `ui/ErrorState.tsx`
- [ ] Create error.tsx files using ErrorState or create new error component
- [ ] Implement `app/error.tsx` for root-level errors
- [ ] Create error.tsx for each major route
- [ ] Add error logging/reporting (console or external service)
- [ ] Add "Try Again" functionality with error reset
- [ ] Test with intentional errors (throw new Error)
- [ ] Document error handling pattern

**Acceptance Criteria:**
- [ ] All major routes have error.tsx
- [ ] Errors are caught and displayed gracefully
- [ ] Error details logged for debugging
- [ ] Users can recover from errors with reset
- [ ] Consistent error UI across routes
- [ ] App doesn't crash completely on route errors

---

#### Story 5.3: Optimize Client vs Server Component Usage

**Effort:** 2 weeks  
**Dependencies:** Story 5.1, 5.2 (loading and error boundaries should be in place first)

**Context:**  
Currently, ALL page components use `"use client"` directive. This is suboptimal for Next.js App Router. We should convert pages to Server Components where possible and move client-side logic to client components.

**Current State:**
```typescript
// ALL of these are client components:
app/page.tsx                    - "use client"
app/notes/page.tsx              - "use client"
app/notes/[id]/page.tsx        - "use client"
app/category/[slug]/page.tsx   - "use client"
app/tag/[name]/page.tsx        - "use client"
app/automations/page.tsx       - "use client"
app/debug/page.tsx             - "use client"
app/login/page.tsx             - "use client"
app/(routes)/settings/page.tsx - "use client"
app/highlights/[rwId]/page.tsx - "use client"
```

**Why This Matters:**
- Server Components reduce client bundle size
- Initial page loads are faster
- SEO is improved
- Data fetching happens on server

**Conversion Strategy:**
1. Pages should be Server Components by default
2. Create client components for interactive parts
3. Fetch data in Server Components (parallel to loading.tsx)
4. Pass data to client components as props

**Tasks:**
- [ ] Audit all page components to identify client-side requirements
- [ ] Create client components for interactive features
- [ ] Convert pages to Server Components where possible
- [ ] Move data fetching to Server Components using async/await
- [ ] Test each converted page thoroughly
- [ ] Measure bundle size before and after
- [ ] Document conversion patterns and guidelines

**Priority Order for Conversion:**
1. `/category/[slug]` - Simplest, mostly data display
2. `/tag/[name]` - Similar to category
3. `/notes` - List page
4. `/highlights/[rwId]` - Detail page (if highlighting doesn't need client)
5. More complex pages later

**Acceptance Criteria:**
- [ ] At least 50% of pages converted to Server Components
- [ ] Client bundle size measurably reduced
- [ ] No loss of functionality
- [ ] Loading and error states work with Server Components
- [ ] Guidelines documented with examples

---

#### Story 5.4: Implement Proper Metadata for SEO

**Effort:** 4-5 hours  
**Dependencies:** Story 5.3 (easier with Server Components)

**Context:**  
Next.js App Router supports metadata API for SEO. Currently only root layout has metadata. Dynamic routes and pages need proper metadata for SEO.

**Current State:**
```typescript
// ✅ Root layout has basic metadata
export const metadata: Metadata = {
  title: 'Spark | Your Knowledge Hub',
  description: 'Organize your knowledge and spark new insights',
  icons: { ... }
};

// ❌ No other pages have metadata
// ❌ No dynamic metadata for [slug], [id], [name] routes
```

**Tasks:**
- [ ] Create metadata utility functions in `src/lib/utilities/metadata.ts`
- [ ] Add static metadata to static pages:
  - [ ] `/notes` - "Notes | Spark"
  - [ ] `/automations` - "Automations | Spark"
  - [ ] `/settings` - "Settings | Spark"
  - [ ] `/debug` - "Debug | Spark"
- [ ] Add dynamic metadata using `generateMetadata` to:
  - [ ] `/category/[slug]` - "Category: {name} | Spark"
  - [ ] `/tag/[name]` - "Tag: {name} | Spark"
  - [ ] `/notes/[id]` - "{note title} | Spark"
  - [ ] `/highlights/[rwId]` - "{book title} Highlights | Spark"
- [ ] Add Open Graph tags for sharing
- [ ] Add Twitter Card tags
- [ ] Test with SEO tools (Lighthouse, Open Graph debugger)
- [ ] Document metadata patterns

**Metadata Template:**
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  // Fetch data for dynamic content
  const data = await getData(params);
  
  return {
    title: `${data.title} | Spark`,
    description: data.description || 'Organize your knowledge',
    openGraph: {
      title: `${data.title} | Spark`,
      description: data.description,
      type: 'article',
    },
  };
}
```

**Acceptance Criteria:**
- [ ] All routes have proper metadata
- [ ] Dynamic routes generate metadata from data
- [ ] Open Graph tags implemented
- [ ] Twitter Card tags implemented
- [ ] SEO scores improved (measure with Lighthouse)
- [ ] Metadata utilities documented

**Note:** This is significantly easier once pages are Server Components (Story 5.3).

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

- **Directory Structure:** All components organized by feature/type ✅ (95% complete - just cleanup needed)
- **Naming Consistency:** All files follow naming conventions ✅ (90% complete - mostly good)
- **Documentation:** All major patterns documented ✅
- **Index Files:** All directories have index exports (70% complete - needs completion)

### Next.js Best Practices (NEW)

- **Loading States:** Route-level loading.tsx files ❌ (0% - none exist)
- **Error Boundaries:** Route-level error.tsx files ❌ (0% - none exist)
- **Server Components:** Pages using Server Components ❌ (0% - all client)
- **Metadata:** Proper SEO metadata ⚠️ (10% - only root layout)

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

### Recommended Workflow

**Week 1-2: Quick Wins & Critical Cleanup**
- Complete all **Priority 0** stories (deprecated code cleanup)
- Complete **Story 5.1** (loading.tsx files) - immediate UX improvement
- Complete **Story 5.2** (error.tsx files) - better error handling

**Week 3-4: Next.js Optimization**
- Begin **Story 5.3** (Server Components) - start with simple pages
- Add **Story 5.4** (Metadata) as Server Components are converted

**Week 5-6: Organization & Patterns**
- Complete **Priority 1** stories (organization verification)
- Complete **Priority 2.5** stories (context improvements)
- Begin **Priority 2** stories (table abstractions)

**Ongoing: Feature Development**
- Continue with **Priority 3** (enhanced hooks) as needed
- **Priority 4** (testing) can be done in parallel
- **Priority 6** (accessibility) can be tackled incrementally

---

## Notes

- This is a living document - update it as work progresses
- Add new stories as needs are identified
- Archive completed stories to keep document focused
- Adjust priorities based on business needs
- **October 7 Update:** Added Priority 0, 2.5, and 4.5; Enhanced Priority 5 stories with current state details

---

**Last Updated:** October 7, 2025  
**Next Review:** Weekly during active refactoring  
**Major Review:** Conducted October 7, 2025

