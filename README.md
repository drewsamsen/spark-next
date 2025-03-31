# A Note from Kevin

Hi! If you're at this repo, you've probably seen one of my AI coding videos and want to try some of those techniques yourself. If you have no clue what I'm talking about, here's a good video to show you my approach and how to best use this repo: https://youtu.be/gXmakVsIbF0

You can also just use this with your own techniques, that's cool too. 

You can follow the Getting Started instructions below to start using this stack right away. I've found that using a checklist of tasks in the .cursor-tasks.md file is a great way to make a lot of quick and effective progress with AI Coding. I personally use Cursor in Composer Agent mode with Sonnet 3.7, but feel free to use your AI coding tool of choice.

If you need to create the checklist, here are some good prompts to use to go from a high-level idea to a full checklist of stories and tasks: https://chatgpt.com/share/67be0a59-e484-800d-a078-346b2c29d727

You can also use the template in .cursor-template.xml to generate the task list for existing repos. I personally use RepoPrompt to convert the files into a pastable string, but repomix.com is a good option as well. 

# 🚀 Next.js Modern Stack Template

A Next.js template that combines commonly used tools and libraries for building full-stack web applications. This stack is specifically designed to be optimized for AI coding assistants like Cursor.

## 🎯 Overview

This template includes [Next.js 14](https://nextjs.org/) with the App Router, [Supabase](https://supabase.com) for the database and authentication, [Resend](https://resend.com) for transactional emails, and optional integrations with various AI providers and AWS services.

> ⚠️ **Note**: This is my personal template with tools that I personally have experience with and think are solid options for building modern full-stack web application. Your preferences very likely differ, so feel free to fork and modify it for your own use. I won't be accepting pull requests for additional features, but I'll be happy to help you out if you have any questions.

## ✨ Features

### 🏗️ Core Architecture

- [**Next.js 14**](https://nextjs.org/) - React framework with App Router
- [**TypeScript**](https://www.typescriptlang.org/) - Type safety throughout
- [**tRPC**](https://trpc.io/) - End-to-end type-safe APIs
- [**Supabase**](https://supabase.com) - Postgres database with built-in authentication and Row Level Security

### 🎨 UI & Styling

- [**Tailwind CSS**](https://tailwindcss.com/) - Utility-first CSS framework
- [**Framer Motion**](https://www.framer.com/motion/) - Animation library
- [**Lucide Icons**](https://lucide.dev/) - Icon set
- Dark mode with Tailwind CSS

### 🛠️ Development Tools

- [**Storybook**](https://storybook.js.org/) - Component development environment
- [**Geist Font**](https://vercel.com/font) - Typography by Vercel

### 🤖 AI & Background Jobs

- Multiple AI integrations available:
  - [OpenAI](https://openai.com) - GPT-4 and o-series models
  - [Anthropic](https://anthropic.com) - Sonnet-3.5
  - [Perplexity](https://perplexity.ai) - Web search models
  - [Groq](https://groq.com) - Fast inference
- [**Inngest**](https://www.inngest.com/) - Background jobs and scheduled tasks

### 🔧 Infrastructure & Services

- [**Resend**](https://resend.com) - Email delivery
- [**AWS S3**](https://aws.amazon.com/s3/) - File storage
- [**Supabase**](https://supabase.com) - Primary database
  (Note that I don't directly use the supabase client in this template, so you can switch out supabase with other database providers via the DATABASE_URL and DIRECT_URL environment variables.)

### 🔔 Additional Features

- [**react-toastify**](https://fkhadra.github.io/react-toastify/) - Toast notifications
- Utility functions for common operations
- TypeScript and ESLint configuration included

## 🚀 Getting Started

1. Fork this repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and configure your environment variables
4. Start Supabase locally (requires [Docker](https://www.docker.com/) and [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase start
```

5. Set up your database with the setup script:

```bash
npm run setup
```

6. Verify your database setup:

```bash
npm run test-db
```

7. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

You can log in with the test user:
- Email: test@example.com
- Password: password123

### Working with Production Database

This project includes a special development mode that connects to your production database while maintaining all development features:

1. Create a `.env.proddb` file with your production Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   ```

2. Run the development server with production database:
   ```bash
   npm run proddb
   ```

3. When running in this mode, a red "PRODUCTION DB" indicator will appear in the header to remind you that you're connected to the production database.

> ⚠️ **Warning**: Be extremely careful when using this mode as it connects to your real production database. Avoid making destructive changes or running tests that could modify production data.

## 📁 Project Structure

- `app/` - Next.js app router pages and API routes
- `src/`
  - `components/` - UI components
  - `lib/` - Utilities and configurations
    - `api/` - tRPC routers
    - `utils/` - Shared utilities
  - `stories/` - Storybook files
- `supabase/` - Supabase migrations and configurations
  - `migrations/` - Database migrations
- `scripts/` - Setup and utility scripts

## 🚀 Deployment

This template is optimized for deployment on [Vercel](https://vercel.com) with a Supabase database.

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your API keys from the Supabase dashboard:
   - Project Settings → API
   - Copy the URL, anon key, and service role key

### Vercel Setup

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Configure the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - Add any other variables from `.env.example` that you're using
5. Deploy!

### Post-Deployment

1. Apply migrations to your production Supabase project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

2. Set up your custom domain in Vercel (optional):
   - Go to your project settings
   - Navigate to Domains
   - Add your domain and follow the DNS configuration instructions

## Realtime Updates with Supabase

This project uses Supabase Realtime to provide live updates to the UI when data changes in the database. This is particularly useful for background jobs and automated processes that run without direct user interaction.

### How Realtime Works

1. **Database Changes**: When data changes in the Supabase database, it triggers realtime events
2. **Client Subscriptions**: The frontend subscribes to these events using custom hooks
3. **Automatic UI Updates**: Components automatically update when relevant data changes

### Using Realtime in Components

To use realtime updates in your components:

```tsx
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';

function YourComponent() {
  // Subscribe to changes on a specific table
  const { isConnected } = useRealtimeSubscription(
    { table: 'your_table_name' },
    (payload) => {
      // Handle the changes here
      console.log('Data changed:', payload);
      // Update your local state or fetch fresh data
    }
  );

  return (
    <div>
      {isConnected && <div>Realtime connected!</div>}
      // Rest of your component
    </div>
  );
}
```

### Domain-Specific Hooks

We've also created domain-specific hooks for common use cases:

- `useFunctionLogs`: Manages function logs with realtime updates
- Add more hooks as we develop more realtime features

### Adding Realtime to New Tables

To enable realtime for a new table:

1. Create a migration that adds the table to the realtime publication
2. Create appropriate RLS policies for the realtime messages
3. Create a hook that leverages the base `useRealtimeSubscription` hook

See the migration files for examples of how to set this up.

## 📝 License

MIT License
