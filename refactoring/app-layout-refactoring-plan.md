# App Layout Refactoring Plan

## Background

The current `app-layout.tsx` file (previously named `dashboard-layout.tsx`) contains the main layout used by all authenticated pages in our application. This component has grown quite large and complex, handling multiple responsibilities:

- Managing sidebar visibility (left, right, and nested)
- Loading data for different sidebar sections
- Handling navigation between routes
- Tracking active items and selections
- Managing UI state for multiple components

The current implementation has several issues:

1. **State Management Complexity**: Contains numerous redundant state variables
2. **Excessive Component Size**: Over 450 lines of code with multiple responsibilities
3. **Redundant Code Patterns**: Many similar patterns repeated for different sidebars
4. **Poor Separation of Concerns**: Mixes UI, data loading, and navigation logic

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

- [ ] **Create interfaces for component props**
  - Define interfaces for all sub-components
  - Use consistent naming conventions
  - Include proper JSDoc comments for props

- [ ] **Add typed URL parameters**
  - Define TypeScript types for URL parameters
  - Use typed route parameters for type safety
  - Add helper functions for route parameter extraction

### 3. Utility Functions

- [ ] **Extract local storage utility functions**
  - Create or update `/src/lib/utils.ts` to include the storage functions
  - Ensure functions are properly typed and exported
  - Replace direct calls in app-layout.tsx with imports
  - Add type safety and error handling
  - Support additional storage options (sessionStorage, IndexedDB)

- [ ] **Extract sidebar helper functions to a utility file**
  - Create `/src/lib/sidebar-utils.ts`
  - Move getSidebarTitle, getSidebarIcon, getSidebarItems functions
  - Ensure proper typing and exports

- [ ] **Implement versioned storage**
  - Add version information to stored preferences
  - Handle migrations for breaking changes
  - Add feature to reset to defaults

### 4. State Management

- [ ] **Create a SidebarContext for centralized state management**
  - Create a new context to manage all sidebar state
  - Extract sidebar state from AppLayout
  - Include state for sidebar visibility, active items, and theme options
  - Add functions for toggling sidebar visibility

- [ ] **Create a custom hook for sidebar visibility state**
  - Create `/src/hooks/useSidebarVisibility.ts`
  - Move leftSidebarOpen, rightSidebarOpen state and toggle functions
  - Include localStorage persistence logic
  - Return visibility states and toggle functions

- [ ] **Create a custom hook for active sidebar selection state**
  - Create `/src/hooks/useSidebarSelection.ts`
  - Move nestedSidebarOpen, activeSidebarType, activeSidebarItem, activeItemId states
  - Include toggle and selection functions
  - Handle the sidebar open/close logic

- [ ] **Eliminate redundant sidebar type state**
  - Remove `activeSidebarType` state
  - Derive sidebar type from `activeSidebarItem` when needed
  - Add a helper function to convert menu item names to sidebar types

- [ ] **Replace multiple boolean states with a single sidebar visibility state**
  - Replace individual visibility states with a single object
  - Use the sidebar type as the key
  - Simplify the toggling logic

- [ ] **Unify active item tracking**
  - Replace separate active item states with a single object
  - Key by sidebar type
  - Add helper functions for setting and getting active items

- [ ] **Implement separate search field state for each sidebar**
  - Create a searchQueries object keyed by sidebar type
  - Persist search query state between sidebar toggles
  - Add helper functions to get/set search queries by sidebar type
  - Clear search on sidebar type change when appropriate

### 5. Navigation

- [ ] **Extract navigation logic to a custom hook**
  - Create `/src/hooks/useAppNavigation.ts`
  - Move navigateTo and handleItemSelect functions
  - Handle sidebar closing on navigation
  - Return navigation functions
  - Manage route changes and history

### 6. Data Loading

- [ ] **Create a custom hook for sidebar data loading**
  - Create `/src/hooks/useSidebarData.ts`
  - Move data loading logic for books, sparks, notes, etc.
  - Implement proper loading and error states
  - Return data and loading states
  - Accept sidebar type as parameter

- [ ] **Consolidate loading states into a single entity**
  - Replace individual loading states with a Map or object
  - Key the loading states by sidebar type
  - Add helpers to check if any sidebar is loading

- [ ] **Optimize data fetching with React Query**
  - Add React Query for data fetching and caching
  - Configure query keys based on sidebar type
  - Implement automatic refetching and background updates

- [ ] **Implement retry logic for data loading**
  - Add automatic retry for failed data fetches
  - Show loading progress and retry options
  - Handle offline scenarios

### 7. Component Structure

- [ ] **Create a SidebarManager component**
  - Create `/src/components/Layout/SidebarManager.tsx`
  - Move nested sidebar rendering logic
  - Handle sidebar state and item selection
  - Accept visibility props from parent

- [ ] **Create a NestedSidebarContainer component**
  - Extract nested sidebar rendering into a dedicated component
  - Accept children and handle positioning logic
  - Apply correct z-index and animations

- [ ] **Create sidebar content components for each type**
  - Create separate components for Books, Sparks, Categories, Tags, and Notes
  - Each should accept items, loading state, and selection handler
  - Handle rendering and interaction specific to that item type

- [ ] **Refactor main AppLayout component**
  - Simplify the main component to use the new hooks and components
  - Keep only layout structure in the main component
  - Ensure proper prop passing to new components
  - Use the new sidebar components instead of conditional rendering

### 8. Error Handling and Resilience

- [ ] **Add error boundaries for sidebar components**
  - Wrap sidebar components in error boundaries
  - Show user-friendly error states
  - Log errors for debugging

### 9. Performance Optimizations

- [ ] **Add memoization for expensive computations**
  - Use useMemo for derived state
  - Memoize item filtering and sorting
  - Optimize helper functions that run frequently

- [ ] **Implement virtualized lists for large datasets**
  - Add virtualization for sidebar items
  - Only render items in view
  - Support smooth scrolling of large lists

### 10. Effect Cleanup

- [ ] **Simplify useEffect dependencies**
  - Review all useEffect hooks and minimize dependencies
  - Use functional updates where appropriate
  - Consider using useCallback for handlers passed to effects

- [ ] **Remove unnecessary state tracking refs**
  - Replace isLoadingRef with better state management
  - Consider if servicesRef is still needed with new hooks

### 11. Code Cleanup and Testing

- [ ] **Remove console.log statements**
  - Remove all debug console.log statements
  - Consider adding proper logging mechanism if needed

- [ ] **Apply consistent formatting and organization**
  - Ensure consistent naming conventions
  - Group related functions and state
  - Add appropriate comments for complex logic

- [ ] **Create tests for new components and hooks**
  - Write unit tests for extracted hooks
  - Write component tests for new components
  - Ensure all functionality is preserved
  - Test navigation logic
  - Verify loading states and error handling

## Rationale for Task Ordering

This implementation order ensures that each task builds upon the previous ones:

1. **File Organization and Naming**: Creates the foundation for file structure
2. **Type Definitions**: Establishes types needed by all other components
3. **Utility Functions**: Creates reusable functions needed by hooks and components
4. **State Management**: Implements core state management before UI components
5. **Navigation**: Navigation logic depends on state management
6. **Data Loading**: Separates data concerns from UI components
7. **Component Structure**: Creates UI components using the established hooks
8. **Error Handling**: Adds resilience to the created components
9. **Performance Optimizations**: Enhances the performance of working components
10. **Effect Cleanup**: Refines the implementation details
11. **Code Cleanup and Testing**: Ensures quality and maintainability

Each task should be completed with a pull request that includes appropriate tests and documentation. The refactoring should be done incrementally to avoid breaking functionality.

## Conclusion

This refactoring plan will significantly improve the maintainability, performance, and structure of the app layout. By breaking the monolithic component into smaller, focused pieces and implementing proper state management, we'll create a more robust foundation for future development. 