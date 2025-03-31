-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
  -- Standard Supabase columns
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Book specific columns from sample data
  rw_id BIGINT UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  rw_category TEXT,
  source TEXT,
  rw_num_highlights INTEGER DEFAULT 0,
  rw_last_highlight_at TIMESTAMPTZ,
  rw_updated TIMESTAMPTZ,
  cover_image_url TEXT,
  highlights_url TEXT,
  asin TEXT
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS books_user_id_idx ON public.books(user_id);

-- Auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own books
CREATE POLICY select_own_books ON public.books
FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own books
CREATE POLICY insert_own_books ON public.books
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own books
CREATE POLICY update_own_books ON public.books
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own books
CREATE POLICY delete_own_books ON public.books
FOR DELETE USING (auth.uid() = user_id);

-- Add comment to the table
COMMENT ON TABLE public.books IS 'Stores book information imported from Readwise'; 