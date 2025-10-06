# App Layout Refactoring Plan

## TL;DR - Quick Status

**What we have**: 
- ✅ SidebarContext, custom hooks, and utilities CREATED
- ❌ AppLayout NOT USING any of the new infrastructure
- ❌ ~200 lines of duplicate state management code

**What we need to do**:
1. **Phase 1** (Priority): Integrate SidebarContext into AppLayout → save ~50-70 lines
2. **Phase 2**: Remove inline data loading, use existing service hooks → save ~80-100 lines  
3. **Phase 3** (Optional): Polish and optimize

**Target**: AppLayout from 420 → 250 lines with cleaner architecture

---

## Current Status (Updated October 2025)

**CRITICAL FINDING**: Infrastructure has been created but NOT integrated! The custom hooks, context, and utilities exist but AppLayout is still using the old inline state management pattern.

### Key Issues Found

1. **Duplicate State Management**: 
   - Created: `SidebarContext`, `useSidebarVisibility`, `useSidebarSelection`, `useSidebarSearch`
   - Reality: `AppLayout.tsx` still uses inline state (lines 50-70) and doesn't import any of the new hooks
   - Impact: ~200 lines of duplicate state management code across context + AppLayout

2. **Missing Integration**:
   - `SidebarProvider` is not wrapping the app in `/src/app/layout.tsx`
   - `AppLayout.tsx` doesn't use `useSidebar()` hook from the context
   - All the infrastructure was built but never wired up

3. **Console.log Statements**:
   - Lines 196-200, 206, 215, 232: Debug logging still present in AppLayout
   - Should be removed per Section 11 of this plan

4. **Data Loading Pattern**:
   - AppLayout manages data loading inline (lines 122-236)
   - Multiple similar patterns for books, sparks, notes, categories, tags
   - Should be extracted to dedicated hooks (Section 6)

5. **Navigation Logic**:
   - `navigateTo` function (lines 263-278) is inline in AppLayout
   - Should be extracted to a custom hook (Section 5)

### Decision Point: Context vs Individual Hooks

We have TWO parallel implementations:
1. **SidebarContext** - Centralized context managing all sidebar state
2. **Individual Hooks** - Separate hooks (useSidebarVisibility, useSidebarSelection, useSidebarSearch)

**Recommendation**: Choose ONE approach:
- **Option A** (Recommended): Use SidebarContext + useSidebar hook
  - Simpler: One source of truth
  - Better: Avoid prop drilling
  - Trade-off: Slightly more coupling
  
- **Option B**: Use individual hooks without context
  - More modular: Each concern is separate
  - More flexible: Can use hooks independently
  - Trade-off: More props to pass around

**Suggested Path**: Use SidebarContext since it's already implemented with all the features. The individual hooks can be kept as utilities or removed if redundant.

### Immediate Next Steps

**Phase 1: Integration (Priority)**
1. Wrap app with `SidebarProvider` in `/src/app/layout.tsx` or `/src/app/AppShell.tsx`
2. Refactor `AppLayout.tsx` to use `useSidebar()` hook instead of inline state
3. Remove duplicate state variables from AppLayout
4. Test that all sidebar functionality still works

**Phase 2: Data Loading (After Phase 1)**
5. Extract data loading logic to custom hooks per Section 6
6. Simplify AppLayout to just compose UI, not manage data

**Phase 3: Cleanup & Optimization (After Phase 2)**
7. Remove console.log statements
8. Decide on individual hooks vs context (remove unused code)
9. Add error boundaries and performance optimizations

## Background

The current `AppLayout.tsx` file (previously named `dashboard-layout.tsx`) contains the main layout used by all authenticated pages in our application. This component has grown quite large and complex, handling multiple responsibilities:

- Managing sidebar visibility (left, right, and nested)
- Loading data for different sidebar sections
- Handling navigation between routes
- Tracking active items and selections
- Managing UI state for multiple components

The current implementation has several issues:

1. **State Management Complexity**: Contains numerous redundant state variables
2. **Excessive Component Size**: Over 420 lines of code with multiple responsibilities
3. **Redundant Code Patterns**: Many similar patterns repeated for different sidebars
4. **Poor Separation of Concerns**: Mixes UI, data loading, and navigation logic
5. **Unused Infrastructure**: Custom hooks and context exist but are not being used

## General Guidance

When implementing these refactors, consider the following principles:

- Follow the component structure guidelines in our cursor rules
- Keep components small and focused on a single responsibility
- Move utility functions and types to appropriate locations
- Use custom hooks for state management and data fetching
- Remove debug logging statements
- Make incremental changes that can be tested individually
- Establish consistent patterns for similar functionality
- Be mindful of unnecessary re-renders or excessive effect dependencies

## Refactoring Tasks

The tasks below are arranged in optimal sequential order for implementation:

### 1. File Organization and Naming

- [x] **Rename component from "dashboard-layout" to "app-layout"**
  - Already completed but verify all references have been updated
  - Update any comments or documentation referencing "dashboard layout"

- [x] **Move layout files to a dedicated layouts directory**
  - Create a `/src/layouts` directory for layout components
  - Move `app-layout.tsx` to `/src/layouts/AppLayout.tsx`
  - Update imports in other files

### 2. Type Definitions

- [x] **Move type definitions to a central location**
  - Add SidebarType and SidebarItem to `/src/lib/types.ts`
  - Ensure types are properly exported
  - Update imports in app-layout.tsx and other files

- [x] **Create interfaces for component props**
  - Define interfaces for all sub-components
  - Use consistent naming conventions
  - Include proper JSDoc comments for props

- [x] **Add typed URL parameters**
  - Define TypeScript types for URL parameters
  - Use typed route parameters for type safety
  - Add helper functions for route parameter extraction

### 3. Utility Functions

- [x] **Extract local storage utility functions**
  - Create or update `/src/lib/utils.ts` to include the storage functions
  - Ensure functions are properly typed and exported
  - Replace direct calls in app-layout.tsx with imports
  - Add type safety and error handling
  - Support additional storage options (sessionStorage, IndexedDB)

- [x] **Extract sidebar helper functions to a utility file**
  - Create `/src/lib/sidebar-utils.tsx`
  - Move getSidebarTitle, getSidebarIcon, getSidebarItems functions
  - Ensure proper typing and exports

### 4. State Management

**STATUS: Infrastructure created but NOT integrated into AppLayout!**

- [⚠️] **Create a SidebarContext for centralized state management**
  - ✅ Created `/src/contexts/sidebar-context.tsx`
  - ✅ Context includes visibility, selection, and search state
  - ❌ **NOT INTEGRATED**: AppLayout is not using SidebarContext
  - ❌ **NOT WRAPPED**: App is not wrapped with SidebarProvider
  - **ACTION NEEDED**: Wrap app with SidebarProvider and refactor AppLayout to use the context

- [⚠️] **Create a custom hook for sidebar visibility state**
  - ✅ Created `/src/hooks/useSidebarVisibility.ts`
  - ✅ Implements localStorage persistence
  - ✅ Returns visibility states and toggle functions
  - ❌ **NOT USED**: AppLayout still has its own inline visibility state
  - **ACTION NEEDED**: Remove inline state from AppLayout and use hook or context

- [⚠️] **Create a custom hook for active sidebar selection state**
  - ✅ Created `/src/hooks/useSidebarSelection.ts`
  - ✅ Implements toggle and selection functions
  - ✅ Handles sidebar open/close logic
  - ❌ **NOT USED**: AppLayout still has its own inline selection state
  - **ACTION NEEDED**: Remove inline state from AppLayout and use hook or context

- [⚠️] **Eliminate redundant sidebar type state**
  - ✅ SidebarContext derives `activeSidebarType` from `activeSidebarItem`
  - ✅ Helper function `getSidebarTypeFromItem` exists in sidebar-utils.tsx
  - ❌ **NOT APPLIED**: AppLayout still maintains separate `activeSidebarType` state
  - **ACTION NEEDED**: Remove redundant state when integrating context/hooks

- [⚠️] **Replace multiple boolean states with a single sidebar visibility state**
  - ✅ useSidebarVisibility uses a single state object
  - ✅ SidebarContext uses unified visibility state
  - ❌ **NOT APPLIED**: AppLayout still uses separate boolean states
  - **ACTION NEEDED**: Apply unified state pattern when integrating

- [⚠️] **Unify active item tracking**
  - ✅ Hooks and context use unified selection state
  - ❌ **NOT APPLIED**: AppLayout still tracks items separately
  - **ACTION NEEDED**: Apply unified tracking when integrating

- [⚠️] **Implement separate search field state for each sidebar**
  - ✅ Created `/src/hooks/useSidebarSearch.ts`
  - ✅ Implements per-sidebar search queries with persistence
  - ❌ **NOT USED**: Search state is managed in NestedSidebar component via uiService
  - **ACTION NEEDED**: Consider if this hook should replace uiService search management

### 5. Navigation

**STATUS: Not started**

- [ ] **Extract navigation logic to a custom hook**
  - Create `/src/hooks/useAppNavigation.ts`
  - Move `navigateTo` function (currently lines 263-278 in AppLayout)
  - Move `handleItemSelect` function (currently lines 307-324 in AppLayout)
  - Handle sidebar closing on navigation using `shouldKeepSidebarOpen` helper
  - Return navigation functions
  - Manage route changes and history
  - **BLOCKER**: Should be done AFTER integrating SidebarContext (Phase 1) so it can access sidebar state

### 6. Data Loading

**STATUS: Partially done - hooks exist but not unified**

- [ ] **Create a custom hook for sidebar data loading**
  - **EXISTING**: `useBooksService`, `useSparksService`, `useNotesService` already exist in `/src/hooks`
  - **EXISTING**: `useCategories` and `useTags` in `/src/hooks/use-categorization.ts`
  - **ISSUE**: AppLayout duplicates loading logic (lines 122-236) instead of using these hooks directly
  - **ACTION NEEDED**: 
    - AppLayout should use existing service hooks directly
    - Remove inline data loading from AppLayout
    - Consider creating a unified `useSidebarData(type)` hook that dispatches to the right service
  - **BLOCKER**: Should be done AFTER Phase 1 integration

- [ ] **Consolidate loading states into a single entity**
  - **CURRENT**: AppLayout uses single `isLoading` state (line 63)
  - **ISSUE**: Single loading state can't show which sidebar is loading
  - **ACTION NEEDED**: 
    - Use loading states from individual hooks (already available)
    - Or create a `loadingStates` map keyed by sidebar type
  - **PRIORITY**: Medium (current approach mostly works)

- [ ] **Optimize data fetching with React Query**
  - **ASSESSMENT**: Existing hooks already handle caching and lifecycle
  - **ACTION NEEDED**: 
    - Optional enhancement - current pattern works
    - If added, would need to refactor all service hooks
  - **PRIORITY**: Low (optimization, not required)

- [ ] **Implement retry logic for data loading**
  - **CURRENT**: No retry logic exists
  - **ACTION NEEDED**: 
    - Add retry to service hooks if needed
    - Or add to repositories
  - **PRIORITY**: Low (nice-to-have feature)

### 7. Component Structure

**STATUS: Partially done - components exist but could be improved**

- [ ] **Create a SidebarManager component**
  - **ASSESSMENT**: Not necessary with current architecture
  - **CURRENT**: AppLayout directly renders NestedSidebar conditionally (lines 368-391)
  - **ACTION NEEDED**: 
    - Current approach is fine for now
    - Could be extracted if we add more sidebar types or complexity
  - **PRIORITY**: Low (optional refactoring)

- [ ] **Create a NestedSidebarContainer component**
  - **CURRENT**: NestedSidebar exists at `/src/components/Layout/NestedSidebar.tsx`
  - **ASSESSMENT**: Already handles its own positioning and styling
  - **ACTION NEEDED**: 
    - Current implementation is good
    - Positioning logic is already contained (lines 368-374 in AppLayout)
  - **PRIORITY**: Low (already implemented)

- [ ] **Create sidebar content components for each type**
  - **CURRENT**: NestedSidebar is generic and handles all types
  - **EXISTING**: SidebarItemList component handles rendering (imported in NestedSidebar)
  - **ASSESSMENT**: Generic approach works well, type-specific components may not be needed
  - **ACTION NEEDED**: 
    - Only create type-specific components if we find special rendering needs
    - Current generic approach is maintainable
  - **PRIORITY**: Low (not needed currently)

- [ ] **Refactor main AppLayout component**
  - **CURRENT**: 420 lines with mixed concerns
  - **ACTION NEEDED**: 
    - **Phase 1**: Integrate SidebarContext (will reduce ~50-70 lines)
    - **Phase 2**: Use existing service hooks directly (will reduce ~80-100 lines)
    - **Phase 3**: Extract navigation to hook (will reduce ~20 lines)
    - **Target**: Reduce to ~200-250 lines focused on layout
  - **PRIORITY**: HIGH - this is the main goal of the refactoring

### 8. Error Handling and Resilience

**STATUS: Not implemented**

- [ ] **Add error boundaries for sidebar components**
  - **CURRENT**: No error boundaries exist
  - **ACTION NEEDED**: 
    - Create ErrorBoundary component
    - Wrap NestedSidebar and potentially other layout components
  - **PRIORITY**: Medium (good for production resilience)

### 9. Performance Optimizations

**STATUS: Some optimizations exist**

- [ ] **Add memoization for expensive computations**
  - **CURRENT**: NestedSidebar uses uiService for filtering/sorting (lines 91-94)
  - **ACTION NEEDED**: 
    - Review if getSidebarItems needs memoization (currently lines 326-335 in AppLayout)
    - Add useMemo for filteredAndSortedItems if not already done
  - **PRIORITY**: Low (optimize only if performance issues arise)

- [ ] **Implement virtualized lists for large datasets**
  - **CURRENT**: Regular rendering in SidebarItemList
  - **ACTION NEEDED**: 
    - Only implement if users have 100s of items and see performance issues
    - Would require react-window or similar library
  - **PRIORITY**: Low (premature optimization)

### 10. Effect Cleanup

**STATUS: Needs review**

- [ ] **Simplify useEffect dependencies**
  - **CURRENT**: Multiple useEffects in AppLayout (lines 83-89, 92-105, 108-120, 122-193, 196-200, 203-218, 221-236)
  - **ACTION NEEDED**: 
    - After Phase 1 integration, many of these will be removed
    - Review remaining effects for proper dependencies
  - **PRIORITY**: Medium (do as part of Phase 1)

- [ ] **Remove unnecessary state tracking refs**
  - **CURRENT**: 
    - `isLoadingRef` (line 73) - seems unused
    - `servicesRef` (lines 76-89) - used to avoid effect re-runs
  - **ACTION NEEDED**: 
    - Remove isLoadingRef if truly unused
    - servicesRef may not be needed after Phase 2 refactoring
  - **PRIORITY**: Medium (cleanup as part of refactoring)

### 11. Code Cleanup and Testing

**STATUS: Cleanup needed**

- [ ] **Remove console.log statements**
  - **CURRENT**: Debug logs at lines 196-200, 206, 215, 232 in AppLayout
  - **ACTION NEEDED**: Remove all console.log statements
  - **PRIORITY**: High (should be done in Phase 1 or 2)

- [ ] **Apply consistent formatting and organization**
  - **CURRENT**: Code is relatively well-organized
  - **ACTION NEEDED**: 
    - Final cleanup pass after refactoring
    - Ensure comments are up to date
    - Remove any dead code
  - **PRIORITY**: Low (final polish)

## Revised Implementation Strategy

### Why Previous Approach Didn't Work

The original plan created infrastructure (hooks, context, utils) first, then planned to integrate later. This resulted in:
- Duplicate code (infrastructure + old implementation)
- No validation that the new code actually works
- Stalled progress (infrastructure exists but unused)

### New Phased Approach

**Phase 1: Integration & Simplification** (HIGH PRIORITY)
1. Wrap app with SidebarProvider
2. Refactor AppLayout to use useSidebar hook
3. Remove duplicate inline state management
4. Remove console.log statements
5. Verify all sidebar functionality works
- **Goal**: Working app with ~50-70 fewer lines, single source of truth for state
- **Risk**: Low (SidebarContext already tested)

**Phase 2: Data Loading Cleanup** (MEDIUM PRIORITY)
1. Remove inline data loading from AppLayout (lines 122-236)
2. Use existing service hooks directly in AppLayout
3. Remove unused refs (isLoadingRef, possibly servicesRef)
4. Simplify remaining useEffects
- **Goal**: AppLayout reduced to ~250 lines, clear separation of concerns
- **Risk**: Low (service hooks already exist and work)

**Phase 3: Optional Enhancements** (LOW PRIORITY)
1. Extract navigation to custom hook (if AppLayout is still complex)
2. Decide on individual hooks vs context (remove unused code)
3. Add error boundaries
4. Add performance optimizations (only if needed)
- **Goal**: Polish and optimize
- **Risk**: Low (incremental improvements)

### Decision Points

1. **Context vs Hooks**: Recommend using SidebarContext + useSidebar(). Individual hooks (useSidebarVisibility, useSidebarSelection, useSidebarSearch) can be kept as utilities or removed if redundant.

2. **Data Loading**: Use existing service hooks directly rather than creating a new unified useSidebarData hook. Simpler and already working.

3. **Component Structure**: Keep current structure (generic NestedSidebar). Don't create type-specific components unless needed.

### Success Criteria

- [ ] AppLayout under 250 lines
- [ ] Single source of truth for sidebar state (no duplicate state)
- [ ] No console.log statements
- [ ] All sidebar functionality works (highlights, sparks, notes, categories, tags)
- [ ] Navigation works correctly
- [ ] Data loads correctly for all sidebar types
- [ ] No regressions in user experience

## Conclusion

This refactoring plan has been updated to reflect the current state: infrastructure exists but needs integration. The revised phased approach focuses on:

1. **Immediate value**: Integrate existing SidebarContext to eliminate duplicate state
2. **Clear wins**: Use existing service hooks to remove inline data loading
3. **Pragmatic scope**: Focus on what matters (state management + data loading), skip nice-to-haves

The goal is not perfection, but significant improvement: reduce AppLayout from 420 to ~250 lines with better separation of concerns and single source of truth for state. Additional optimizations (error boundaries, virtualization, etc.) can be added later if needed.

**Next Action**: Start Phase 1 - integrate SidebarProvider and refactor AppLayout to use useSidebar hook. 