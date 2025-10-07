# Spark Application Refactoring Plan

**Last Updated:** October 7, 2025  
**Status:** Active Development - Reorganized for Sequential Execution

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Completed Foundation](#architecture--completed-foundation)
3. [Active Stories (Work These in Order)](#active-stories-work-these-in-order)
4. [Completed Major Initiatives](#completed-major-initiatives)
5. [Success Metrics](#success-metrics)
6. [How to Use This Document](#how-to-use-this-document)

---

## Overview

This document provides the current, consolidated refactoring plan for the Spark application. **Stories are numbered sequentially in priority order** - work on Story 1 first, then Story 2, then Story 3, and so on.

**Application Context:**
- **Single-user application** for personal use only
- **Local development** with eventual production deployment (still single-user)
- **No SEO requirements** - not a public-facing application
- **Performance is secondary** to maintainability and developer experience

**Refactoring Focus:**
Given the personal/single-user context, this plan prioritizes:
1. **Developer experience** - Easy to understand and modify
2. **Code maintainability** - Easy to work with after time away
3. **Debugging capabilities** - Quick to troubleshoot issues
4. **Data safety** - Backup and recovery for personal data
5. **Code quality** - Reduce duplication, improve organization

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

#### ✅ Completed Cleanup (Priority 0)
- Removed deprecated legacy services (books-service.ts, sparks-service.ts)
- Removed unused hooks (useQueryHooks.ts)
- Cleaned up deprecated repository methods
- Added loading.tsx files to all major routes
- Added error.tsx files to all major routes
- Cleaned up empty directories
- Component organization verified and documented

---

## Active Stories (Work These in Order)

**Instructions:** Work on stories sequentially. Start with Story 1, then Story 2, etc.

---

### 📋 PHASE 1: Code Organization & Standards

**Goal:** Improve code organization for better maintainability and developer experience.

---

#### ✅ Story 1: Create Index Files for Component Directories [COMPLETED]

**Effort:** 1-2 hours  
**Dependencies:** None

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
- [x] Create `src/components/auth/index.ts`
- [x] Create `src/components/integrations/index.ts`
- [x] Create `src/components/theme/index.ts`
- [x] Verify completeness of `src/components/Layout/index.ts`
- [x] Verify completeness of `src/components/Providers/index.ts`
- [x] Update imports to use directory imports where beneficial

**Acceptance Criteria:**
- [x] Every component directory has a complete `index.ts`
- [x] All components are exported from their directory index
- [x] Common component imports use directory-level imports
- [x] Import statements are cleaner and more maintainable

**Existing Index Files (all verified complete):**
```
✅ src/components/FunctionLogs/index.ts
✅ src/components/Highlights/index.ts
✅ src/components/SparkPreview/index.ts
✅ src/components/ScheduledTasks/index.ts
✅ src/components/Sidebar/index.ts
✅ src/components/ui/index.ts
✅ src/components/icons/index.ts
✅ src/components/Layout/index.ts
✅ src/components/Providers/index.ts
✅ src/components/auth/index.ts (NEW)
✅ src/components/integrations/index.ts (NEW)
✅ src/components/theme/index.ts (NEW)
```

**Files Updated:**
- Created `src/components/auth/index.ts` with exports for AuthCheck, LoginForm, LogoutButton
- Created `src/components/integrations/index.ts` with exports for AirtableIntegration, ReadwiseIntegration
- Created `src/components/theme/index.ts` with exports for ModeToggle, ThemeAwareToast, ThemeProvider
- Updated imports in `src/components/Layout/Header.tsx` to use directory imports
- Updated imports in `src/app/layout.tsx` to use directory imports
- Updated imports in `src/app/login/page.tsx` to use directory imports
- Updated imports in `src/components/ui/Toast.tsx` to use directory imports

---

#### ✅ Story 2: Standardize Component File Naming (PascalCase) [COMPLETED]

**Effort:** 30 minutes  
**Dependencies:** Story 1

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
- [x] Verify all component files (files with JSX/TSX exported components) use PascalCase
- [x] Document that utility/type files can use kebab-case
- [x] Ensure new components follow PascalCase convention

**Acceptance Criteria:**
- [x] All React component files use PascalCase
- [x] Type/utility files appropriately use kebab-case
- [x] Naming convention is documented
- [x] Application runs without errors

**Completion Summary:**
- ✅ Verified all component files follow PascalCase naming
- ✅ Confirmed only appropriate files use kebab-case (contexts, utilities, types, shadcn/ui)
- ✅ Enhanced `.cursor/rules/file-structure.mdc` with comprehensive naming conventions
- ✅ Created detailed verification report in `docs/development/NAMING-CONVENTIONS-VERIFICATION.md`
- ✅ No changes needed - codebase already follows best practices!
- ✅ No linter errors

---

#### ✅ Story 3: Reorganize Hooks by Feature [COMPLETED]

**Effort:** 1-2 hours  
**Dependencies:** None

**Context:**  
Currently, all hooks are in a flat `src/hooks/` directory. While this works, grouping related hooks would improve organization and discoverability.

**Implemented Structure:**
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
    - use-function-logs-data.ts
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
```

**Tasks:**
- [x] Create subdirectories in `src/hooks/`
- [x] Move hooks to appropriate subdirectories
- [x] Create index.ts in each subdirectory
- [x] Update main `src/hooks/index.ts` to re-export all
- [x] Update imports throughout codebase

**Acceptance Criteria:**
- [x] Hooks organized by logical grouping
- [x] Each subdirectory has index.ts
- [x] Main hooks/index.ts exports all hooks
- [x] All imports updated and working

**Completion Summary:**
- ✅ Created 5 subdirectories: auth, services, data, ui, patterns
- ✅ Moved 18 hook files to appropriate directories
- ✅ Created index.ts files in each subdirectory with proper exports
- ✅ Updated main hooks/index.ts to re-export from subdirectories
- ✅ Fixed all internal relative imports within hooks
- ✅ No linter errors

---

#### Story 4: Standardize Utility Organization

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
  - storage/                  # NEW: storage.ts, client-storage.ts
  
  Keep at root level:
  - inngest.ts               # Inngest initialization
  - inngest-db-logger-middleware.ts  # Inngest-specific
  - types.ts                 # Core types used everywhere
  - errors.ts                # Core error handling
  - error-handling.ts        # Error utilities
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

### 📋 PHASE 2: Code Quality & Duplication Reduction

**Goal:** Reduce code duplication and improve code quality through abstraction.

---

#### Story 5: Create Reusable Date & Duration Formatting Utilities

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

#### Story 6: Abstract Table Filtering, Sorting, and Pagination Patterns

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

#### Story 7: Create Reusable Table UI Components

**Effort:** 3-4 hours  
**Dependencies:** Story 6

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

#### Story 8: Create Standardized Search Component

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

#### Story 9: Create Standardized Filter Component

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

### 📋 PHASE 3: Context & State Management

**Goal:** Improve state management and reduce prop drilling through better context usage.

---

#### Story 10: Extract Focus Mode to Context

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

#### Story 11: Consolidate Authentication Hooks

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

### 📋 PHASE 4: Data Safety & Backup (HIGH VALUE) 🔒

**Goal:** Protect your personal data with export, import, and seeding capabilities.

**Why This Matters:** Since this is a personal application with your own data, data safety is critical. These stories protect against data loss and enable easy backup/restore.

---

#### Story 12: Implement Data Export Functionality

**Effort:** 3-4 hours  
**Dependencies:** None

**Context:**  
Personal data in Spark (highlights, notes, categories, etc.) should be exportable for backup and portability. This protects against data loss and allows easy migration.

**Tasks:**
- [ ] Create export service in `src/lib/utilities/data-export.ts`
- [ ] Support exporting all user data to JSON
- [ ] Support exporting specific collections (books, notes, highlights, etc.)
- [ ] Include metadata (timestamps, relationships)
- [ ] Add UI in settings/debug page for triggering exports
- [ ] Support downloading as file
- [ ] Include data validation on export

**Proposed API:**
```typescript
// src/lib/utilities/data-export.ts
export async function exportAllData(): Promise<ExportData>
export async function exportCollection(collection: CollectionType): Promise<any[]>
export function downloadExport(data: ExportData, filename: string): void
```

**Acceptance Criteria:**
- [ ] Can export all data to structured JSON
- [ ] Can export individual collections
- [ ] Export includes all necessary metadata
- [ ] Downloaded files are properly formatted
- [ ] Export is validated before download
- [ ] UI accessible from settings or debug page

---

#### Story 13: Implement Data Import/Restore Functionality

**Effort:** 3-4 hours  
**Dependencies:** Story 12

**Context:**  
Complement the export functionality with the ability to import/restore data. This enables backup restoration and data migration.

**Tasks:**
- [ ] Create import service in `src/lib/utilities/data-import.ts`
- [ ] Validate import data structure
- [ ] Support full data restore
- [ ] Support selective collection import
- [ ] Handle conflicts (duplicate IDs, etc.)
- [ ] Add UI for uploading import files
- [ ] Show preview before importing
- [ ] Add confirmation for destructive operations

**Proposed API:**
```typescript
// src/lib/utilities/data-import.ts
export async function validateImportData(data: any): Promise<ValidationResult>
export async function importAllData(data: ExportData, mode: 'replace' | 'merge'): Promise<void>
export async function importCollection(collection: CollectionType, data: any[]): Promise<void>
```

**Acceptance Criteria:**
- [ ] Can import previously exported data
- [ ] Data validation prevents corrupt imports
- [ ] Handles conflicts appropriately
- [ ] Preview shows what will be imported
- [ ] Confirmation required for destructive operations
- [ ] Clear error messages for invalid data

---

#### Story 14: Database Seeding for Development

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
When developing or testing, it's useful to have seed data available. This makes it easier to test features and verify behavior.

**Tasks:**
- [ ] Create seed data utilities in `src/scripts/seed-data.ts`
- [ ] Create sample books, highlights, notes
- [ ] Create sample categories and tags
- [ ] Support seeding via script or UI
- [ ] Include option to clear all data (with confirmation)
- [ ] Add to debug page for easy access

**Acceptance Criteria:**
- [ ] Can seed database with sample data
- [ ] Seed data is realistic and useful
- [ ] Can clear data (with strong confirmation)
- [ ] Available via script and UI
- [ ] Works in local development

---

### 📋 PHASE 5: Development Tooling & Debugging

**Goal:** Improve debugging capabilities and development workflow.

**Why This Matters:** As the sole developer, good debugging tools save time and frustration when troubleshooting issues.

---

#### Story 15: Enhanced Debug Page

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
The `/debug` page should be a comprehensive tool for development, testing, and troubleshooting.

**Current State:**
- Basic debug page exists
- Error boundary test added

**Enhancements:**
- [ ] Add database query testing panel
- [ ] Add API endpoint testing
- [ ] Add service layer testing
- [ ] Show current environment variables (non-sensitive)
- [ ] Add cache clearing utilities
- [ ] Add localStorage inspection/editing
- [ ] Add Supabase connection status
- [ ] Add recent error logs viewer
- [ ] Add performance profiling tools

**Acceptance Criteria:**
- [ ] Can test database queries directly
- [ ] Can test API endpoints with custom payloads
- [ ] Can clear various caches
- [ ] Can view and edit localStorage
- [ ] Connection status is visible
- [ ] Recent errors are logged and viewable
- [ ] Only accessible in development mode

---

#### Story 16: Improved Error Messages and Logging

**Effort:** 2-3 hours  
**Dependencies:** None

**Context:**  
Better error messages and logging make debugging faster and easier, especially when working solo.

**Tasks:**
- [ ] Enhance error messages with context
- [ ] Add structured logging utility
- [ ] Log important operations (imports, deletions, etc.)
- [ ] Add request/response logging in development
- [ ] Create error aggregation view
- [ ] Add search/filter for logs
- [ ] Include stack traces in development

**Proposed Logging Utility:**
```typescript
// src/lib/utilities/logger.ts
export const logger = {
  info: (message: string, context?: any) => void,
  warn: (message: string, context?: any) => void,
  error: (message: string, error?: Error, context?: any) => void,
  debug: (message: string, context?: any) => void,
}
```

**Acceptance Criteria:**
- [ ] Consistent error message format
- [ ] Context included in error messages
- [ ] Structured logging throughout app
- [ ] Can view logs in debug page
- [ ] Logs include timestamps and context
- [ ] Development mode shows detailed logs

---

#### Story 17: Configuration Management Improvements

**Effort:** 1-2 hours  
**Dependencies:** None

**Context:**  
Make it easy to adjust application settings without code changes.

**Tasks:**
- [ ] Create settings panel in debug/settings page
- [ ] Support runtime configuration overrides
- [ ] Add feature flags for experimental features
- [ ] Add ability to toggle development features
- [ ] Store preferences in localStorage
- [ ] Document available configuration options

**Acceptance Criteria:**
- [ ] Can adjust settings without code changes
- [ ] Settings persist across sessions
- [ ] Feature flags work properly
- [ ] Configuration options are documented
- [ ] Changes take effect immediately (or after refresh)

---

### 📋 PHASE 6: Enhanced Hooks & Consistent Patterns

**Goal:** Implement consistent patterns across all data hooks with proper loading states, error handling, and optimistic updates.

---

#### Story 18: Implement Enhanced Hooks for Books Service

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

#### Story 19: Implement Enhanced Hooks for Highlights Service

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

#### Story 20: Implement Enhanced Hooks for Notes Service

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

#### Story 21: Standardize Error Handling Across All Hooks

**Effort:** 3-4 hours  
**Dependencies:** Stories 18, 19, 20

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

#### Story 22: Implement Retry Logic for Network Requests

**Effort:** 2-3 hours  
**Dependencies:** Story 21

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

### 📋 PHASE 7: API Layer Consistency

**Goal:** Standardize API patterns for easier maintenance and debugging.

**Why This Matters:** Consistent patterns reduce cognitive load when making changes to the API layer.

---

#### Story 23: Standardize API Route Authentication

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

#### Story 24: Standardize API Response Format

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

### 📋 PHASE 8: Testing Infrastructure

**Goal:** Add unit tests for repositories, services, and hooks to prevent regressions.

**Why This Matters:** Even for personal use, tests prevent regressions and serve as documentation of intended behavior.

---

#### Story 25: Implement Unit Tests for Repositories

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

#### Story 26: Implement Unit Tests for Services

**Effort:** 1 week  
**Dependencies:** Story 25

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

#### Story 27: Implement Unit Tests for Custom Hooks

**Effort:** 1 week  
**Dependencies:** Story 26

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

### 📋 PHASE 9: Documentation (Ongoing)

**Goal:** Add comprehensive JSDoc documentation for better IDE support and code clarity.

**Why This Matters:** When returning to code after weeks/months away, good documentation makes it much easier to understand what functions do and how to use them.

---

#### Story 28: Add Comprehensive JSDoc Comments

**Effort:** Ongoing  
**Dependencies:** None

**Context:**  
Functions, classes, and types should have JSDoc comments for better IDE support and documentation. This is especially valuable when returning to the codebase after time away.

**Tasks:**
- [ ] Add JSDoc to all repository methods
- [ ] Add JSDoc to all service methods
- [ ] Add JSDoc to all custom hooks
- [ ] Add JSDoc to utility functions
- [ ] Add JSDoc to type definitions
- [ ] Include usage examples for complex functions

**Acceptance Criteria:**
- [ ] All public APIs have JSDoc comments
- [ ] JSDoc includes parameter descriptions
- [ ] JSDoc includes return type descriptions
- [ ] JSDoc includes usage examples where helpful
- [ ] IDE provides helpful autocomplete and hints

**Note:** This can be done incrementally as you touch files for other stories.

---

### 📋 PHASE 10: Optional Next.js Optimizations

**Status:** Lower priority - implement only if time permits or for learning purposes.

**Context:** These Next.js best practices have reduced importance for a single-user application. Server Components and performance optimizations provide less benefit when the app runs locally and serves only one user.

---

#### Story 29: Optimize Client vs Server Component Usage (Optional)

**Effort:** 2 weeks  
**Dependencies:** None

**Context for Single-User:**  
While Server Components reduce bundle size and improve performance, these benefits are less impactful for local/single-user deployment. This story is marked optional - only pursue if interested in learning Server Components or planning to share the app publicly later.

**Deprioritization Rationale:**
- Performance gains minimal for single-user
- Client Components work fine for personal use
- Time better spent on debugging tools and data safety
- Can revisit if deployment needs change

**Tasks (If Pursued):**
- [ ] Audit all page components to identify client-side requirements
- [ ] Create client components for interactive features
- [ ] Convert pages to Server Components where possible
- [ ] Move data fetching to Server Components using async/await
- [ ] Test each converted page thoroughly
- [ ] Document conversion patterns and guidelines

**Acceptance Criteria:**
- [ ] At least 50% of pages converted to Server Components (optional)
- [ ] No loss of functionality
- [ ] Loading and error states work with Server Components
- [ ] Guidelines documented with examples

---

#### Story 30: Review and Optimize Routing Structure (Optional)

**Effort:** 3-4 hours  
**Dependencies:** None

**Context for Single-User:**  
Routing structure review is a nice-to-have. The current structure works fine for personal use.

**Tasks (If Pursued):**
- [ ] Audit current routing structure
- [ ] Identify opportunities for route groups
- [ ] Review nested layouts
- [ ] Document routing decisions

**Acceptance Criteria:**
- [ ] Routing structure documented
- [ ] Any improvements implemented

---

## Completed Major Initiatives

These significant refactoring efforts have been completed and documented here for reference.

### ✅ Priority 0: Critical Cleanup & Technical Debt [COMPLETED]

All stories in this priority have been completed. Deprecated code has been removed and technical debt cleaned up.

**Completed Stories:**
- ✅ Story 0.1: Remove Deprecated Legacy Services
- ✅ Story 0.2: Remove Unused/Deprecated Hooks
- ✅ Story 0.3: Clean Up Deprecated Repository Methods
- ✅ Story 5.1: Implement loading.tsx for Route Loading States
- ✅ Story 5.2: Implement error.tsx for Error Boundaries
- ✅ Story 1.1: Reorganize UI Components into Feature Directories

---

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

## Success Metrics

**Updated for Single-User Context** - Focusing on maintainability and developer experience over performance and scale.

### ✅ Code Quality Metrics (PRIMARY FOCUS)

- **Component Size:** Average component < 200 lines ✅ **ACHIEVED**
- **Service Coverage:** All database access through repositories ✅ **ACHIEVED**
- **Type Safety:** < 5 `any` types in application code ✅ **ACHIEVED**
- **Hook Pattern:** All data hooks follow standard pattern ⏳ **80% complete**
- **Code Duplication:** Minimal duplicate logic 🎯 **Target: <5% duplicate code**
- **API Consistency:** Standardized patterns across all API routes 🎯 **Target: 100%**

### ✅ Organization & Maintainability (PRIMARY FOCUS)

- **Directory Structure:** All components organized by feature/type ✅ **100% ACHIEVED**
- **Naming Consistency:** All files follow naming conventions ✅ **100% ACHIEVED**
- **Documentation:** All major patterns documented ✅ **100% ACHIEVED**
- **Index Files:** All directories have index exports ✅ **100% ACHIEVED**
- **JSDoc Coverage:** Public APIs documented 🎯 **Target: 80% of public methods**

### ✅ Error Handling & Debugging (PRIMARY FOCUS)

- **Loading States:** Route-level loading.tsx files ✅ **100% - all major routes covered**
- **Error Boundaries:** Route-level error.tsx files ✅ **100% - all major routes covered**
- **Error Logging:** Structured error logging 🎯 **Target: All errors logged with context**
- **Debug Tools:** Comprehensive debug page 🎯 **Target: Database + API + Cache tools**

### ✅ Data Safety (NEW - HIGH PRIORITY)

- **Data Export:** Full data export capability 🎯 **Target: Export all collections**
- **Data Import:** Restore from backup 🎯 **Target: Safe import with validation**
- **Data Seeding:** Development seed data 🎯 **Target: Realistic test data**

### Testing Metrics (MEDIUM PRIORITY)

- **Unit Test Coverage:** >80% for repositories and services 🎯 **Target: 80%**
- **Hook Test Coverage:** >80% for custom hooks 🎯 **Target: 80%**
- **Test Reliability:** Stable, passing tests 🎯 **Target: <5% flaky rate**

### Performance Metrics (DEPRIORITIZED)

- ~~Bundle Size~~ - Not critical for single-user
- ~~Load Time~~ - Local deployment, already fast
- ~~Rendering Optimizations~~ - Apply only if specific issues identified
- **Note:** Monitor performance, but don't proactively optimize

### SEO & Accessibility (DEPRIORITIZED)

- ~~SEO Metadata~~ - Not needed for personal app
- ~~Accessibility Compliance~~ - Nice-to-have, not required for personal use
- **Note:** Basic keyboard navigation is good practice but not a blocker

---

## How to Use This Document

### For Developers

1. **Find the next story:** Look for the lowest numbered story that isn't marked complete
2. **Read the context:** Understand why the work is needed
3. **Check dependencies:** Ensure any dependent stories are complete
4. **Follow the tasks:** Work through tasks in order
5. **Verify acceptance criteria:** Ensure all criteria are met before marking complete
6. **Mark complete:** Add ✅ to the story title when done
7. **Move to next story:** Continue with the next sequential story number

### Current Progress

**Completed:** Stories 0.1-0.3, Story 5.1, Story 5.2, Story 1.1 (from old numbering), Story 1, Story 2, Story 3 ✅  
**Next Story:** Story 4 (Standardize Utility Organization)

### Ongoing Practices

- Add JSDoc as you write/modify code
- Write unit tests for new services/repositories
- Keep debug page updated with useful tools
- Export your data periodically as backup
- Update this document as stories are completed

---

## Notes

- This is a living document - update it as work progresses
- Mark stories as complete (✅) when all acceptance criteria are met
- Stories are numbered sequentially in priority order
- Adjust order based on actual usage and pain points (document changes)
- Skip optional stories (29-30) unless interested in learning or planning to make app public

**Major Updates:**
- October 7, 2025 - Initial comprehensive review
- October 7, 2025 - Single-user context reorganization
- October 7, 2025 - **Stories renumbered sequentially (1-30) in priority order**
- October 7, 2025 - **Story 1 completed** - Created index files for all component directories
- October 7, 2025 - **Story 2 completed** - Verified and documented component naming conventions
- October 7, 2025 - **Story 3 completed** - Reorganized hooks into feature-based subdirectories

---

**Last Updated:** October 7, 2025  
**Next Review:** Weekly during active refactoring  
**Next Story:** Story 4 - Standardize Utility Organization

