# Spark Next.js Application Refactoring Guide

## Introduction

This document provides a comprehensive, step-by-step refactoring guide for the Spark Next.js application. It's designed to progressively align our codebase with the design principles documented in `.cursor/rules` while addressing technical debt and improving code quality.

Each item is represented as a one-point developer story with context, guidance, and specific references to the codebase where relevant. Check off items as they are completed to track progress.

## Refactoring Goals

1. **Improve Type Safety**: Eliminate `any` types and ensure proper interfaces for all data structures
2. **Standardize Repository-Service-Hook Pattern**: Ensure consistent implementation of the pattern across the application
3. **Optimize Component Structure**: Decompose large components and ensure proper organization
4. **Align Directory Structure**: Organize files according to our documented standards
5. **Standardize Error Handling**: Create consistent error handling and feedback patterns
6. **Reduce Code Duplication**: Abstract common patterns into reusable utilities
7. **Unify Naming Conventions**: Apply consistent naming across all files
8. **Improve Frontend Structure**: Align with Next.js App Router best practices

## Methodology

- Each story addresses a single, focused concern
- Work through stories in the recommended order (prioritizing high-impact changes)
- Maintain backward compatibility throughout the refactoring process
- Write tests for critical functionality before making significant changes
- Commit frequently with clear, descriptive messages

## High-Level Refactoring Plan

1. Begin with defining shared types and interfaces
2. Create base patterns and utilities for consistent implementations
3. Refactor hooks to follow the standardized pattern
4. Break down large components into smaller, focused components
5. Reorganize directory structure and standardize file naming
6. Improve authentication and error handling
7. Address code duplication through abstraction
8. Align frontend structure with Next.js best practices

## Developer Stories

### Type Safety Improvements

- [x] **Create shared interfaces for Spark model**  
  Define proper interfaces for Spark entities in `src/lib/types.ts` replacing `any` types in `src/hooks/use-sparks.ts`. Include all properties used throughout the application.

- [x] **Create shared interfaces for Book model**  
  Define proper interfaces for Book entities in `src/lib/types.ts` to replace any implicit or `any` types in book-related components and hooks.

- [x] **Create shared interfaces for Highlight model**  
  Define proper interfaces for Highlight entities in `src/lib/types.ts` to replace any implicit or `any` types in highlight-related components and hooks.

- [x] **Create shared interfaces for User model**  
  Define proper interfaces for User entities in `src/lib/types.ts` to replace any implicit or `any` types in user-related components and hooks.

- [x] **Create shared interfaces for Category model**  
  Define proper interfaces for Category entities in `src/lib/types.ts` to replace any implicit or `any` types in category-related components and hooks.

- [x] **Create shared interfaces for Tag model**  
  Define proper interfaces for Tag entities in `src/lib/types.ts` to replace any implicit or `any` types in tag-related components and hooks.

- [x] **Create shared interfaces for UserSettings model**  
  Define proper interfaces for UserSettings entities in `src/lib/types.ts` to replace any implicit or `any` types in settings-related components and hooks.

- [x] **Create shared interfaces for Integration model**  
  Define proper interfaces for Integration entities in `src/lib/types.ts` to replace any implicit or `any` types in integration-related components and hooks.

- [x] **Create shared interfaces for FunctionLog model**  
  Review `src/repositories/function-logs.repository.ts` and ensure the `FunctionLogModel` type is properly exported from `src/lib/types.ts`.

- [x] **Refactor use-sparks.ts to use proper types**  
  Replace all instances of `any` in `src/hooks/use-sparks.ts` with the new interfaces. Update function parameters and return types for proper type safety.

- [x] **Refactor use-function-logs.ts to use proper types**  
  Replace all instances of `any` in `src/hooks/use-function-logs.ts` with the new interfaces. Update function parameters and return types for proper type safety.

- [x] **Refactor use-categorization.ts to use proper types**  
  Replace all instances of `any` in `src/hooks/use-categorization.ts` with the new interfaces. Update function parameters and return types for proper type safety.

- [x] **Create proper types for API responses**  
  Define interfaces for standardized API responses in `src/lib/types.ts` following the pattern in the typescript-conventions rule.

- [x] **Implement union types for status enums**  
  Replace string literals with union types for status fields (e.g., for function logs status: "started" | "completed" | "failed").

- [x] **Add JSDoc comments to critical type definitions**  
  Enhance type definitions with JSDoc comments to improve developer understanding and IDE intellisense support.

### Repository-Service-Hook Pattern Consistency

- [x] **Create a base repository abstract class**  
  Enhance `src/repositories/base.repository.ts` to include common CRUD operations and error handling that other repositories can extend.

- [x] **Create a base service abstract class**  
  Create `src/services/base.service.ts` with common service methods and error handling patterns.

- [x] **Create a base hook factory**  
  Implement a hook factory in `src/hooks/use-base-resource.ts` that enforces the standard pattern defined in data-architecture.mdc.

- [x] **Refactor books repository to extend base repository**  
  Update `src/repositories/books.repository.ts` to extend the base repository class for consistent error handling and methods.

- [x] **Refactor books service to use consistent patterns**  
  Update `src/services/books.service.ts` to follow the standardized service pattern.

- [x] **Refactor sparks repository to extend base repository**  
  Update `src/repositories/sparks.repository.ts` to extend the base repository class for consistent error handling and methods.

- [x] **Refactor sparks service to use consistent patterns**  
  Update `src/services/sparks.service.ts` to follow the standardized service pattern.

- [x] **Refactor function-logs repository to extend base repository**  
  Update `src/repositories/function-logs.repository.ts` to extend the base repository class for consistent error handling and methods.

- [x] **Refactor function-logs service to use consistent patterns**  
  Update `src/services/function-logs.service.ts` to follow the standardized service pattern.

- [x] **Implement optimistic updates in all data modification hooks**  
  Review all hooks to ensure they implement optimistic updates for data modifications following the pattern in data-architecture.mdc.

- [x] **Standardize error handling and toast notifications**  
  Ensure all hooks and services follow the same error handling and toast notification pattern for consistent user feedback.

- [x] **Implement auth state change subscription in all data hooks**  
  Ensure all data-fetching hooks properly subscribe to auth state changes and reload data when authentication state changes.

### Component Structure and Styling

- [x] **Break down FunctionLogsTable.tsx**  
  Split the large `src/components/FunctionLogsTable.tsx` (452 lines) into smaller components for table header, table body, status badge, and pagination. Create a new directory to organize these components.

- [x] **Break down nested-sidebar.tsx**  
  Split the large `src/components/nested-sidebar.tsx` (398 lines) into smaller components for different sections of the sidebar.

- [x] **Break down book-highlights.tsx**  
  Split the large `src/components/book-highlights.tsx` (346 lines) into smaller components for different sections and features.

- [x] **Break down spark-preview-panel.tsx**  
  Split the large `src/components/spark-preview-panel.tsx` (323 lines) into smaller components for different sections and features.

- [x] **Break down ScheduledTasksTable.tsx**  
  Split the large `src/components/ScheduledTasksTable.tsx` (217 lines) into smaller components for different parts of the table.

- [ ] **Create a consistent Button component library**  
  Review the current `src/components/Button.tsx` and ensure it follows our styling guidelines using Tailwind CSS.

- [ ] **Create a Toast notification wrapper component**  
  Create a standardized toast notification wrapper in `src/components/ui/Toast.tsx` that all components can use.

- [ ] **Create standardized form components**  
  Create form input, select, checkbox, and other form components using Tailwind CSS for consistent styling.

- [ ] **Review and standardize loading state components**  
  Create standardized loading skeletons and spinners for consistent UX during loading states.

- [ ] **Review and standardize error state components**  
  Create standardized error message components for consistent UX during error states.

- [ ] **Ensure all components use "use client" directive appropriately**  
  Review all components to ensure they include the "use client" directive only when necessary for client-side features.

- [ ] **Implement Icon component standards**  
  Ensure all components use icons from `lucide-react` and follow the naming conventions in components-styling.mdc.

- [ ] **Create consistent table components**  
  Abstract common table patterns (seen in FunctionLogsTable and ScheduledTasksTable) into reusable components.

### Directory Structure Alignment

- [ ] **Organize components by feature**  
  Create subdirectories in `src/components` for feature-specific components (e.g., `src/components/FunctionLogs/`).

- [ ] **Review and reorganize UI components**  
  Ensure all generic UI components are properly placed in `src/components/ui/`.

- [ ] **Move all icon components to proper directory**  
  Ensure all custom icon components are properly placed in `src/components/icons/`.

- [ ] **Create index.ts files for component directories**  
  Add index.ts files to component directories to simplify imports following the example in file-structure.mdc.

- [ ] **Verify Next.js route structure**  
  Review `src/app` directory to ensure it follows the routing structure defined in frontend-structure.mdc.

- [ ] **Reorganize hooks by feature**  
  Group hooks by feature in separate files when appropriate (e.g., auth hooks, user hooks, etc.).

- [ ] **Create central hook index**  
  Update `src/hooks/index.ts` to export all hooks for simplified imports.

- [ ] **Review and update repository organization**  
  Ensure repositories follow consistent organization and naming conventions.

- [ ] **Review and update service organization**  
  Ensure services follow consistent organization and naming conventions.

- [ ] **Organize utility functions by domain**  
  Group utility functions in `src/lib` by domain or functionality.

### Authentication and Error Handling

- [ ] **Create a standard auth verification utility**  
  Create a utility function that standardizes authentication verification for hooks and components.

- [ ] **Implement consistent loading states**  
  Ensure all components handle loading states in a consistent manner with proper UI feedback.

- [ ] **Standardize error boundary implementation**  
  Create reusable error boundary components for Next.js routes.

- [ ] **Implement toast notification standards**  
  Create a standard pattern for displaying toast notifications for user actions using react-toastify.

- [ ] **Add proper authentication error handling**  
  Ensure all components and hooks handle authentication errors consistently.

- [ ] **Implement proper data fetching error handling**  
  Ensure all data fetching hooks handle errors consistently with proper messaging.

- [ ] **Review and update API error handling**  
  Ensure API routes handle errors consistently with proper status codes and messages.

- [ ] **Add retry logic for network requests**  
  Implement standardized retry logic for network requests to improve resilience.

- [ ] **Create global error handling for unhandled exceptions**  
  Implement global error handling for unhandled exceptions to prevent UI crashes.

### Code Duplication Reduction

- [ ] **Create utility functions for date formatting**  
  Move the date formatting logic from `src/hooks/use-function-logs.ts` to a shared utility function in `src/lib/utils.ts`.

- [ ] **Create utility functions for duration formatting**  
  Move the duration formatting logic from `src/hooks/use-function-logs.ts` to a shared utility function in `src/lib/utils.ts`.

- [ ] **Abstract common filtering patterns**  
  Create reusable filtering utilities for data tables based on patterns seen in `src/components/FunctionLogsTable.tsx`.

- [ ] **Abstract common pagination patterns**  
  Create reusable pagination utilities for data tables based on patterns seen in `src/components/FunctionLogsTable.tsx`.

- [ ] **Abstract common sorting patterns**  
  Create reusable sorting utilities for data tables based on patterns seen in `src/components/FunctionLogsTable.tsx`.

- [ ] **Create reusable table skeleton components**  
  Abstract loading skeleton patterns seen across different table components.

- [ ] **Create reusable empty state components**  
  Abstract empty state patterns seen across different components.

- [ ] **Create reusable expansion panel components**  
  Abstract the expandable row pattern from `src/components/FunctionLogsTable.tsx` into a reusable component.

- [ ] **Create a standardized search component**  
  Abstract the search input pattern seen in multiple components into a reusable component.

- [ ] **Create a standardized filter component**  
  Abstract the filter dropdown pattern seen in multiple components into a reusable component.

### Component File Naming Consistency

- [ ] **Rename kebab-case component files to PascalCase**  
  Rename files like `src/components/nested-sidebar.tsx` to `src/components/NestedSidebar.tsx`.

- [ ] **Rename kebab-case component files in layouts directory**  
  Rename files in `src/components/layouts` to follow PascalCase convention.

- [ ] **Rename kebab-case component files in ui directory**  
  Rename files in `src/components/ui` to follow PascalCase convention.

- [ ] **Rename kebab-case component files in icons directory**  
  Rename files in `src/components/icons` to follow PascalCase convention.

- [ ] **Update imports after component renaming**  
  Update all import statements for renamed components.

- [ ] **Ensure consistent exports for components**  
  Verify all components use named exports following the same pattern.

- [ ] **Update index.ts files with new component names**  
  Update index.ts files with the new PascalCase component names.

### Frontend Structure

- [ ] **Review Next.js App Router implementation**  
  Ensure proper usage of the Next.js App Router in the `src/app` directory.

- [ ] **Verify correct layout.tsx implementations**  
  Review all `layout.tsx` files to ensure they follow Next.js conventions.

- [ ] **Verify correct page.tsx implementations**  
  Review all `page.tsx` files to ensure they follow Next.js conventions.

- [ ] **Implement loading.tsx for proper loading states**  
  Add `loading.tsx` files to routes that require custom loading states.

- [ ] **Implement error.tsx for proper error boundaries**  
  Add `error.tsx` files to routes that require custom error handling.

- [ ] **Verify correct usage of client and server components**  
  Ensure all components are properly marked as client or server components based on their functionality.

- [ ] **Review and optimize routing structure**  
  Optimize the routing structure for better performance and user experience.

- [ ] **Implement proper metadata for SEO**  
  Add proper metadata to all pages for improved SEO.

- [ ] **Verify proper environment variable usage**  
  Ensure environment variables are properly used following Next.js conventions.

### Additional Improvements

- [ ] **Add end-to-end tests for critical flows**  
  Implement end-to-end tests for critical user flows to prevent regressions during refactoring.

- [ ] **Add unit tests for critical services**  
  Implement unit tests for critical service methods to ensure proper functionality.

- [ ] **Add unit tests for critical hooks**  
  Implement unit tests for critical hooks to ensure proper functionality.

- [ ] **Add proper JSDoc comments to functions**  
  Add JSDoc comments to functions for better documentation and IDE support.

- [ ] **Optimize database queries in repositories**  
  Review all repository methods to ensure efficient database queries.

- [ ] **Review and optimize React rendering performance**  
  Identify and resolve unnecessary re-renders in components.

- [ ] **Implement proper memoization for expensive operations**  
  Use React.memo, useMemo, and useCallback appropriately to optimize performance.

- [ ] **Review and update accessibility features**  
  Ensure all components follow proper accessibility guidelines.

- [ ] **Implement consistent keyboard navigation**  
  Add proper keyboard navigation support for all interactive components.

- [ ] **Update README with developer guide**  
  Update the project README with information about the refactoring process and new patterns.

## Conclusion

This refactoring guide provides a comprehensive path to aligning our codebase with the design principles in `.cursor/rules`. By methodically working through these developer stories, we can improve code quality, maintainability, and consistency across the application.

Remember that refactoring is an iterative process - it's recommended to make small, incremental changes with proper testing to minimize the risk of introducing bugs. Regular code reviews during the refactoring process will also help ensure the new code adheres to our standards. 