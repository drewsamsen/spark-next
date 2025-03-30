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