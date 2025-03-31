-- Create highlights table to store Readwise highlight data
CREATE TABLE IF NOT EXISTS highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  rw_id INTEGER NOT NULL,
  rw_text TEXT,
  rw_note TEXT,
  rw_location TEXT,
  rw_location_type TEXT,
  rw_highlighted_at TIMESTAMPTZ,
  rw_url TEXT,
  rw_color TEXT,
  rw_updated TIMESTAMPTZ,
  rw_book_id INTEGER,
  rw_tags JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, rw_id)
);

-- Add Row Level Security (RLS) to highlights table
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own highlights
CREATE POLICY "Users can only view their own highlights" 
  ON highlights FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own highlights
CREATE POLICY "Users can insert their own highlights" 
  ON highlights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own highlights
CREATE POLICY "Users can update their own highlights" 
  ON highlights FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own highlights
CREATE POLICY "Users can delete their own highlights" 
  ON highlights FOR DELETE 
  USING (auth.uid() = user_id);
  
-- Create indexes for faster queries
-- Index on user_id and rw_id for uniqueness checks
CREATE INDEX highlights_user_id_rw_id_idx ON highlights(user_id, rw_id);

-- Index on book_id to quickly find all highlights for a book
CREATE INDEX highlights_book_id_idx ON highlights(book_id);

-- Index on text for text search capabilities
CREATE INDEX highlights_rw_text_idx ON highlights USING gin(to_tsvector('english', rw_text));

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_highlights_modified_timestamp
BEFORE UPDATE ON highlights
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();
