-- Fix type mismatch in search_highlights_keyword function
-- Change rank from float (double precision) to real to match ts_rank() return type

-- Drop the existing function first (required when changing return types)
DROP FUNCTION IF EXISTS search_highlights_keyword(text, uuid, integer);

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
  rank real  -- Changed from float to real
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

