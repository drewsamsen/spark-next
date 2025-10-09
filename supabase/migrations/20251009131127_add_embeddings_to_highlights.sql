-- Enable pgvector extension for vector similarity search
-- This extension must be enabled before creating vector columns
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to store OpenAI embeddings (1536 dimensions for text-embedding-3-small or text-embedding-ada-002)
ALTER TABLE highlights 
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Add timestamp to track when embedding was last generated
ALTER TABLE highlights 
  ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Create HNSW index for fast similarity search
-- HNSW (Hierarchical Navigable Small World) is optimized for high-dimensional vectors
-- Using cosine distance (vector_cosine_ops) as it's normalized and works well with embeddings
-- m=16 and ef_construction=64 are balanced defaults for performance vs accuracy
CREATE INDEX IF NOT EXISTS highlights_embedding_idx 
  ON highlights 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Create index on embedding_updated_at for efficient querying of unprocessed highlights
CREATE INDEX IF NOT EXISTS highlights_embedding_updated_at_idx 
  ON highlights(embedding_updated_at);

-- Helper function for semantic search using cosine similarity
-- Returns highlights ordered by similarity (most similar first)
-- Filters by user_id to respect RLS and user ownership
CREATE OR REPLACE FUNCTION search_highlights_semantic(
  query_embedding vector(1536),
  match_user_id uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  book_id uuid,
  rw_id integer,
  rw_text text,
  rw_note text,
  rw_location text,
  rw_location_type text,
  rw_highlighted_at timestamptz,
  rw_url text,
  rw_color text,
  rw_updated timestamptz,
  rw_book_id integer,
  rw_tags jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  embedding vector(1536),
  embedding_updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.user_id,
    h.book_id,
    h.rw_id,
    h.rw_text,
    h.rw_note,
    h.rw_location,
    h.rw_location_type,
    h.rw_highlighted_at,
    h.rw_url,
    h.rw_color,
    h.rw_updated,
    h.rw_book_id,
    h.rw_tags,
    h.created_at,
    h.updated_at,
    h.embedding,
    h.embedding_updated_at,
    1 - (h.embedding <=> query_embedding) as similarity
  FROM highlights h
  WHERE h.user_id = match_user_id
    AND h.embedding IS NOT NULL
  ORDER BY h.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Helper function for keyword search with full-text search
-- Returns highlights that match the search text
CREATE OR REPLACE FUNCTION search_highlights_keyword(
  search_text text,
  match_user_id uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  book_id uuid,
  rw_id integer,
  rw_text text,
  rw_note text,
  rw_location text,
  rw_location_type text,
  rw_highlighted_at timestamptz,
  rw_url text,
  rw_color text,
  rw_updated timestamptz,
  rw_book_id integer,
  rw_tags jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  embedding vector(1536),
  embedding_updated_at timestamptz,
  rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.user_id,
    h.book_id,
    h.rw_id,
    h.rw_text,
    h.rw_note,
    h.rw_location,
    h.rw_location_type,
    h.rw_highlighted_at,
    h.rw_url,
    h.rw_color,
    h.rw_updated,
    h.rw_book_id,
    h.rw_tags,
    h.created_at,
    h.updated_at,
    h.embedding,
    h.embedding_updated_at,
    ts_rank(to_tsvector('english', h.rw_text), plainto_tsquery('english', search_text)) as rank
  FROM highlights h
  WHERE h.user_id = match_user_id
    AND (
      h.rw_text ILIKE '%' || search_text || '%' 
      OR h.rw_note ILIKE '%' || search_text || '%'
    )
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Comment on the new columns
COMMENT ON COLUMN highlights.embedding IS 'OpenAI embedding vector (1536 dimensions) for semantic search';
COMMENT ON COLUMN highlights.embedding_updated_at IS 'Timestamp when the embedding was last generated or updated';

