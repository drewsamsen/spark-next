# Spark

A modern web application for collecting, organizing, and exploring content across various sources. Spark helps you connect ideas, build knowledge, and discover insights.

## Overview

Spark is a Next.js application built with a focus on clean architecture, type safety, and developer experience. It uses Supabase for data persistence, Inngest for background jobs, and follows a standardized repository-service-hook pattern.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Lucide icons
- **State Management**: React hooks
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Background Jobs**: Inngest
- **Notifications**: `react-toastify`
- **API**: TypeScript interfaces with strict typing
- **Deployment**: Vercel

## Architecture

Spark follows a layered architecture:

1. **Repository Layer**: Handles direct database access through Supabase
2. **Service Layer**: Implements business logic using repositories
3. **React Hooks**: Provides components with access to services
4. **Components**: Consume hooks for UI and interactions

This pattern ensures separation of concerns, testability, and maintainability.

## Key Design Patterns

- **Clean Architecture**: Separation of concerns with distinct layers
- **Repository Pattern**: Abstraction over database operations
- **Service Pattern**: Centralized business logic
- **Hook Pattern**: Simplified component access to services
- **Atomic Components**: Small, reusable UI components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for local Supabase)
- Supabase CLI

### Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/spark.git
   cd spark
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment:
   ```bash
   cp .env.example .env.local
   ```

4. Start local Supabase:
   ```bash
   supabase start
   ```

5. Initialize the database:
   ```bash
   npm run setup
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Development with Production Database

For testing with production data:

1. Create `.env.proddb` with production credentials
2. Run:
   ```bash
   npm run proddb
   ```

⚠️ **Warning**: Be careful when using production data. A red "PRODUCTION DB" indicator will appear in the header.

## Project Structure

```
├── app/                        # Next.js App Router
├── src/
│   ├── components/             # UI components
│   ├── repositories/           # Data access layer
│   ├── services/               # Business logic layer
│   ├── hooks/                  # React hooks
│   ├── inngest/                # Background jobs
│   └── lib/                    # Utilities and types
├── .cursor/                    # Development standards
└── docs/                       # Documentation
```

## Development Standards

Our development follows standardized practices defined in `.cursor/rules`:

- **Data Architecture**: Repository-service-hook pattern
- **Components & Styling**: Functional components with Tailwind
- **TypeScript**: Strict typing conventions
- **Inngest Jobs**: Background processing patterns
- **File Structure**: Consistent directory organization

These standards serve as the authoritative reference for development.

### Development Guidelines

- Use TypeScript with strict typing
- Prefer functional components with `"use client"` when needed
- Implement new features following the `repo → service → hook → component` flow
- Centralize types in `src/lib/types.ts`
- Follow established naming conventions:
  - **PascalCase** for components
  - **kebab-case** for routes

## Background Jobs

Spark uses Inngest for reliable background processing. Jobs follow a modular structure:

```
src/inngest/
├── functions/             # Job definitions by domain
└── utils/                 # Utility functions
```

All functions implement standardized conventions including naming (`Fn` suffix), error handling, and completion tracking.

## Documentation

Project documentation is available in the `docs/` directory, covering:

- Architecture details
- Development guides
- Feature documentation
- Setup instructions

## License

MIT
