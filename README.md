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

## 📝 License

MIT License
