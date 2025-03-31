-- Create books table to store Readwise book data
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rw_id INTEGER NOT NULL,
  rw_title TEXT,
  rw_author TEXT,
  rw_category TEXT,
  rw_source TEXT,
  rw_num_highlights INTEGER,
  rw_last_highlight_at TIMESTAMPTZ,
  rw_updated TIMESTAMPTZ,
  rw_cover_image_url TEXT,
  rw_highlights_url TEXT,
  rw_source_url TEXT,
  rw_asin TEXT,
  rw_tags TEXT[],
  rw_document_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, rw_id)
);

-- Add Row Level Security (RLS) to books table
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own books
CREATE POLICY "Users can only view their own books" 
  ON books FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own books
CREATE POLICY "Users can insert their own books" 
  ON books FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own books
CREATE POLICY "Users can update their own books" 
  ON books FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own books
CREATE POLICY "Users can delete their own books" 
  ON books FOR DELETE 
  USING (auth.uid() = user_id);
  
-- Create an index on the unique user_id and rw_id combination for faster lookups
CREATE INDEX books_user_id_rw_id_idx ON books(user_id, rw_id);

-- Create an index on rw_title for text search
CREATE INDEX books_rw_title_idx ON books(rw_title);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_modified_timestamp
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();
