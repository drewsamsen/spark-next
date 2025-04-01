-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create book_categories junction table
CREATE TABLE IF NOT EXISTS book_categories (
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  job_action_id UUID NULL, -- Reference to the job action that created this (will be linked later)
  created_by TEXT NULL, -- To track if this was added by AI, user, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, category_id)
);

-- Create highlight_categories junction table
CREATE TABLE IF NOT EXISTS highlight_categories (
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  job_action_id UUID NULL, -- Reference to the job action that created this (will be linked later)
  created_by TEXT NULL, -- To track if this was added by AI, user, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (highlight_id, category_id)
);

-- Add RLS to categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Add RLS to junction tables
ALTER TABLE book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories table
CREATE POLICY "Everyone can view categories" 
  ON categories FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Only authenticated users can create categories" 
  ON categories FOR INSERT 
  TO authenticated WITH CHECK (true);

-- For book_categories, we need to join with books to check user_id
CREATE POLICY "Users can only view their own book categories" 
  ON book_categories FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_categories.book_id 
    AND books.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own book categories" 
  ON book_categories FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_categories.book_id 
    AND books.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own book categories" 
  ON book_categories FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_categories.book_id 
    AND books.user_id = auth.uid()
  ));

-- For highlight_categories, we need to join with highlights to check user_id
CREATE POLICY "Users can only view their own highlight categories" 
  ON highlight_categories FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM highlights 
    WHERE highlights.id = highlight_categories.highlight_id 
    AND highlights.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own highlight categories" 
  ON highlight_categories FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM highlights 
    WHERE highlights.id = highlight_categories.highlight_id 
    AND highlights.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own highlight categories" 
  ON highlight_categories FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM highlights 
    WHERE highlights.id = highlight_categories.highlight_id 
    AND highlights.user_id = auth.uid()
  ));

-- Create indexes for faster lookups
CREATE INDEX book_categories_book_id_idx ON book_categories(book_id);
CREATE INDEX book_categories_category_id_idx ON book_categories(category_id);
CREATE INDEX book_categories_job_action_id_idx ON book_categories(job_action_id);
CREATE INDEX highlight_categories_highlight_id_idx ON highlight_categories(highlight_id);
CREATE INDEX highlight_categories_category_id_idx ON highlight_categories(category_id);
CREATE INDEX highlight_categories_job_action_id_idx ON highlight_categories(job_action_id);

-- Trigger to automatically update updated_at timestamp for categories
CREATE TRIGGER update_categories_modified_timestamp
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();
