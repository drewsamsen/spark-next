# Semantic Search Setup Guide

This guide explains how to set up and use the semantic search feature for highlights using OpenAI embeddings and pgvector.

## Overview

The semantic search feature allows users to search highlights by meaning rather than just keywords. It includes three search modes:

- **Keyword**: Traditional text-based search (case-insensitive substring matching)
- **Semantic**: AI-powered search by meaning using OpenAI embeddings
- **Hybrid**: Combines both keyword and semantic search using Reciprocal Rank Fusion (RRF)

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key to generate embeddings
2. **Supabase Database**: pgvector extension must be enabled

## Setup Instructions

### 1. Enable pgvector Extension in Supabase

**Option A: Via Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to Database → Extensions
3. Search for "vector" 
4. Click "Enable" on the pgvector extension

**Option B: Via SQL (included in migration)**
The migration file already includes the command to enable pgvector, so you can skip this if you run the migration.

### 2. Run Database Migration

The migration file is located at:
```
supabase/migrations/20251009131127_add_embeddings_to_highlights.sql
```

**For Production:**
1. Go to Supabase Dashboard → SQL Editor
2. Open the migration file and copy its contents
3. Paste into the SQL Editor and click "Run"

**For Local Development:**
```bash
npx supabase db reset
```

The migration will:
- Enable pgvector extension
- Add `embedding` column (vector with 1536 dimensions) to highlights table
- Add `embedding_updated_at` timestamp column
- Create HNSW index for fast similarity search
- Create helper functions for semantic and keyword search

### 3. Set Environment Variables

Add your OpenAI API key to your environment:

**For Local Development** (`.env.local`):
```
OPENAI_API_KEY=sk-your-api-key-here
```

**For Production** (Vercel/hosting platform):
Add the `OPENAI_API_KEY` environment variable in your hosting platform's settings.

### 4. Enable the Scheduled Task (Optional)

To automatically generate embeddings for highlights:

1. Go to your app's **Settings** page (`/settings`)
2. Scroll down to the **Scheduled Tasks** table
3. Find "**Generate Embeddings**" in the list
4. In the "Schedule" column, choose a frequency:
   - **Off** - Disabled (default)
   - **Hourly** - Runs every hour (recommended initially)
   - **Daily** - Runs once per day
   - **Weekly** - Runs once per week
   - **Monthly** - Runs once per month
5. The setting saves automatically when you change it

The task will process 5 highlights per run (configurable in the code).

**Note:** You can also click "Run Now" to manually trigger the task and start generating embeddings immediately.

## How It Works

### Embedding Generation

1. The scheduled Inngest function runs at your chosen frequency
2. It fetches up to 5 highlights that don't have embeddings or have been updated since their last embedding
3. Sends the highlight text to OpenAI's `text-embedding-3-small` model
4. Stores the resulting 1536-dimensional vectors in the database

### Search Process

**Keyword Search:**
- Uses PostgreSQL's full-text search capabilities
- Searches in both `rw_text` and `rw_note` fields
- Returns results ranked by text relevance

**Semantic Search:**
1. Generates an embedding for the search query
2. Uses cosine similarity to find highlights with similar meanings
3. Returns results ranked by semantic similarity (0-1 scale)

**Hybrid Search:**
1. Performs both keyword and semantic searches in parallel
2. Uses Reciprocal Rank Fusion (RRF) to combine results
3. Each result gets a score based on its rank in both searches
4. Returns merged results sorted by combined score

## Usage

### In the UI

1. Navigate to any book's highlights page
2. Enter your search query in the search bar
3. Choose a search mode:
   - **Keyword**: Fast, exact text matching
   - **Semantic**: AI-powered meaning-based search
   - **Hybrid**: Best of both worlds

Your search mode preference is saved in localStorage.

### Via API

**Endpoint:** `POST /api/highlights/search`

**Request Body:**
```json
{
  "query": "your search query",
  "mode": "keyword" | "semantic" | "hybrid",
  "limit": 10
}
```

**Response:**
```json
{
  "results": [...],
  "count": 10,
  "mode": "semantic",
  "query": "your search query"
}
```

## Configuration

### Batch Size

To change how many highlights are processed per scheduled run, edit:
```typescript
// src/inngest/functions/embeddings/generate-highlight-embeddings.ts
const BATCH_SIZE = 5; // Change this value
```

### Search Result Limit

Default limit is 50 results. To change:
```typescript
// src/hooks/services/useHighlightSearch.ts
// Change the third parameter (currently 50)
useHighlightSearch('', 'keyword', 50)
```

### Embedding Model

To use a different OpenAI model, edit:
```typescript
// src/lib/openai.ts
const EMBEDDING_MODEL = 'text-embedding-3-small'; // Change this
```

Note: If you change the model, ensure the dimensions match (update migration if needed).

## Monitoring

### Check Embedding Progress

You can check how many highlights have embeddings by running this SQL query:

```sql
SELECT 
  COUNT(*) as total_highlights,
  COUNT(embedding) as with_embeddings,
  COUNT(*) - COUNT(embedding) as without_embeddings
FROM highlights
WHERE user_id = 'your-user-id';
```

### Function Logs

View Inngest function logs:
1. Go to your Inngest dashboard
2. Find "generate-highlight-embeddings" function
3. View execution history and logs

## Costs

The semantic search feature uses OpenAI's API, which has associated costs:

- **Model**: text-embedding-3-small
- **Cost**: ~$0.00002 per 1,000 tokens (as of Oct 2024)
- **Estimate**: Processing 1,000 highlights ≈ $0.02 - $0.10 (depending on highlight length)

Monitor your OpenAI usage at: https://platform.openai.com/usage

## Troubleshooting

### "OPENAI_API_KEY not configured" Error

- Ensure the environment variable is set correctly
- Restart your development server after adding the variable
- For production, redeploy after adding the environment variable

### pgvector Extension Not Found

- Enable the pgvector extension in Supabase Dashboard
- Or ensure the migration SQL was executed successfully

### Slow Search Performance

- Ensure the HNSW index was created (check migration)
- Consider reducing the search result limit
- For hybrid search, results may take longer as it performs two searches

### Embeddings Not Generating

- Check that the scheduled task is enabled in settings
- Verify OPENAI_API_KEY is set
- Check Inngest function logs for errors
- Ensure highlights have text (empty highlights are skipped)

## Files Modified/Created

### New Files
- `src/lib/openai.ts` - OpenAI client and embedding functions
- `src/inngest/functions/embeddings/generate-highlight-embeddings.ts` - Scheduled function
- `src/inngest/functions/embeddings/index.ts` - Export file
- `src/app/api/highlights/search/route.ts` - Search API endpoint
- `src/hooks/services/useHighlightSearch.ts` - React hook for search
- `supabase/migrations/20251009131127_add_embeddings_to_highlights.sql` - Database migration

### Modified Files
- `src/lib/types.ts` - Added search types and embedding fields
- `src/repositories/highlights.repository.ts` - Added search methods
- `src/services/highlights.service.ts` - Added search service
- `src/inngest/types.ts` - Added embedding event type
- `src/inngest/index.ts` - Export embeddings functions
- `src/inngest/functions/scheduled/tasks-cron.ts` - Added embedding task config
- `src/components/Highlights/SearchBar.tsx` - Added search mode selector
- `src/components/Highlights/HighlightsList.tsx` - Integrated API search

## Next Steps

1. Run the database migration in production
2. Add OPENAI_API_KEY to production environment
3. Enable the "Generate Embeddings" scheduled task
4. Wait for embeddings to be generated (or manually trigger the task)
5. Try semantic search on your highlights!

## Support

For issues or questions:
- Check the Inngest function logs
- Review the browser console for client-side errors
- Check Supabase logs for database errors

