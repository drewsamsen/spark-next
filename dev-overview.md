# Tech Stack, Architecture, and Guidelines

## Tech Stack

- **Frontend**: Next.js 15 with App Router  
- **UI**: Tailwind CSS for styling  
- **State Management**: React hooks  
- **Database**: Supabase (PostgreSQL)  
- **Authentication**: Supabase Auth  
- **Background Jobs**: Inngest  
- **Notifications**: `react-toastify`  

## Architecture

- **Repository Layer**: Handles direct database access through Supabase  
- **Service Layer**: Implements business logic using repositories  
- **React Hooks**: Provides components with access to services  
- **Components**: Consume hooks to display UI and handle interactions  

## File Structure

- `/src/repositories`: Database access classes with type-safe operations  
- `/src/services`: Business logic implementation  
- `/src/hooks`: React hooks that expose services to components  
- `/src/components`: UI components (functional, TypeScript, Tailwind)  
- `/src/app`: Next.js App Router routes (server components by default)  
- `/src/inngest`: Background job definitions and configuration  
- `/src/lib`: Shared utilities, types, and helpers  

## Key Design Patterns

- **Clean Architecture**: Separation of concerns with distinct layers  
- **Repository Pattern**: Abstraction over database operations  
- **Service Pattern**: Centralized business logic  
- **Hook Pattern**: Simplified component access to services  
- **Atomic Components**: Small, reusable UI components  

## Development Guidelines

- Use TypeScript with strict typing  
- Prefer functional components with `"use client"` when needed  
- Implement new features following the `repo → service → hook → component` flow  
- Centralize types in `src/lib/types.ts`  
- Follow established naming conventions:  
  - **PascalCase** for components  
  - **kebab-case** for routes  