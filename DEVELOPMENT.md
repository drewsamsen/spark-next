# Development Guide

This document explains the development practices and workflows for this project.

## Development Workflows

### Regular Development

For standard development with the local database:

```bash
npm run dev
```

This runs the Next.js development server connected to your local Supabase instance.

### Production Database Development

For scenarios where you need to test against real production data:

```bash
npm run proddb
```

This runs the Next.js development server in a special mode that connects to your production Supabase database while maintaining all development features like hot reloading.

#### How It Works

The `proddb` command:
1. Loads environment variables from `.env.proddb` instead of `.env.local`
2. Sets a special environment variable `NEXT_PUBLIC_USING_PROD_DB=true` 
3. Displays a red "PRODUCTION DB" indicator in the app header
4. Preserves all development features (hot reloading, error overlays, etc.)

#### Creating the Production Database Configuration

1. Create a `.env.proddb` file in the project root:
   ```
   # Production Database Credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   
   # Keep all other settings the same as development
   # Add other environment variables here as needed
   ```

2. Add `.env.proddb` to your `.gitignore` (this should already be done)

#### Diagnostic Tools

The project includes several diagnostic tools to help with production database connection issues:

1. **Test Production Database Connection**:
   ```bash
   npm run test-proddb
   ```
   Verifies connectivity to your production Supabase instance, checks table access, and tests basic auth functionality.

2. **Test Authentication**:
   ```bash
   npm run test-login
   ```
   An interactive tool to directly test login credentials against either your local or production Supabase instance. Use this to:
   - Verify user credentials work properly
   - Debug authentication issues
   - Test email/password combinations
   - Compare authentication between environments

   The tool will prompt you to choose which environment to test against and which credentials to use.

#### Best Practices for Working with Production Data

When using `npm run proddb`, keep these practices in mind:

1. **Safety First**: 
   - Always be aware that you're connected to real production data
   - Watch for the red "PRODUCTION DB" indicator in the header
   - Be careful with any operations that create, update, or delete data

2. **Appropriate Use Cases**:
   - Debugging issues that only appear in production
   - Testing with realistic production data volume
   - Investigating data inconsistencies
   - Verifying schema changes before deployment

3. **Avoid These Activities**:
   - Running automated tests that modify data
   - Experimenting with destructive operations
   - Making bulk updates or deletions
   - Development of features that heavily modify data structures

4. **Team Communication**:
   - Inform your team when you're working in this mode
   - Consider coordinating with team members to avoid concurrent modifications
   - Document any intentional changes made to production data

5. **Troubleshooting Auth Issues**:
   - If encountering authentication problems, first run `npm run test-login` to verify credentials
   - Clear browser cache and cookies before testing
   - Use incognito/private windows to avoid session conflicts
   - Check browser console for specific error messages

## Authentication and Local Development

When working with the local development environment:

- Test user credentials: test@example.com / password123
- Admin access: Available through Supabase Studio at http://localhost:54323

## Code Conventions

- Follow TypeScript best practices
- Use functional React components with hooks
- Document complex functions and components
- Add types for all props and function parameters
- Prefer async/await over Promise chains

## Build and Deployment

For production builds:

```bash
npm run build
npm run start
```

For deployment guidance, see the README.md file. 