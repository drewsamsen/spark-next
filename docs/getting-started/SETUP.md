# Supabase Development Setup

This document explains how to set up the Supabase development environment for this project.

## Prerequisites

- Node.js
- npm
- Docker (for running Supabase locally)
- Supabase CLI

## Initial Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local` (if not already done)
   - Ensure the Supabase URL and keys match your local setup

## Running Setup Script

We provide a convenient setup script to initialize your local development environment:

```bash
npm run setup
```

This script:
- Checks if Supabase is running, and starts it if needed
- Resets the database and applies all migrations
- Creates a test user for development
- Configures basic auth settings

After running the setup, you can immediately start the development server:

```bash
npm run dev
```

To do both at once:

```bash
npm run setup-and-dev
```

## Test User Credentials

After running the setup script, you can log in with:
- Email: test@example.com
- Password: password123

## Connecting to Production Database

For scenarios where you need to test against production data, we provide a special development mode that connects to your production Supabase database:

1. Create a `.env.proddb` file in the project root with your production credentials:
   ```
   # Production Database Credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   ```

2. Run the development server with the production database connection:
   ```bash
   npm run proddb
   ```

3. A visual indicator (red "PRODUCTION DB" badge) will appear in the app header to remind you that you're working with production data.

⚠️ **Important Safety Precautions:**
- Add `.env.proddb` to your `.gitignore` to prevent accidentally committing production credentials
- Be extremely careful when making changes to data - these changes will affect your live production database
- Avoid running tests or operations that could modify or delete production data
- Use this mode primarily for debugging issues that only appear in production or testing against real data

## Manual Auth Configuration

The setup script will prompt you to manually configure the minimum password length to 8 characters in the Supabase Studio:

1. Open the Supabase Studio at http://localhost:54323
2. Navigate to Authentication > Settings
3. Under "Auth Providers", set minimum password length to 8
4. Save changes

## Accessing Supabase Studio

To access the Supabase admin interface:
- URL: http://localhost:54323

## Troubleshooting

If you encounter issues with the setup script:

1. Ensure Docker is running
2. Check if Supabase is running with `supabase status`
3. If needed, restart Supabase with `supabase stop` and `supabase start` 