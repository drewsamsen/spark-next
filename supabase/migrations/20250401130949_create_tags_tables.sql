-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create book_tags junction table
CREATE TABLE IF NOT EXISTS book_tags (
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  job_action_id UUID NULL, -- Reference to the job action that created this (will be linked later)
  created_by TEXT NULL, -- To track if this was added by AI, user, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),  
  PRIMARY KEY (book_id, tag_id)
);

-- Create highlight_tags junction table
CREATE TABLE IF NOT EXISTS highlight_tags (
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  job_action_id UUID NULL, -- Reference to the job action that created this (will be linked later)
  created_by TEXT NULL, -- To track if this was added by AI, user, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (highlight_id, tag_id)
);

-- Add RLS to tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Add RLS to junction tables
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for tags table - everyone can see all tags
CREATE POLICY "Everyone can view tags" 
  ON tags FOR SELECT 
  TO authenticated USING (true);

CREATE POLICY "Only authenticated users can create tags" 
  ON tags FOR INSERT 
  TO authenticated WITH CHECK (true);

-- For book_tags, we need to join with books to check user_id
CREATE POLICY "Users can only view their own book tags" 
  ON book_tags FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_tags.book_id 
    AND books.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own book tags" 
  ON book_tags FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_tags.book_id 
    AND books.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own book tags" 
  ON book_tags FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = book_tags.book_id 
    AND books.user_id = auth.uid()
  ));

-- For highlight_tags, we need to join with highlights to check user_id
CREATE POLICY "Users can only view their own highlight tags" 
  ON highlight_tags FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM highlights 
    WHERE highlights.id = highlight_tags.highlight_id 
    AND highlights.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own highlight tags" 
  ON highlight_tags FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM highlights 
    WHERE highlights.id = highlight_tags.highlight_id 
    AND highlights.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own highlight tags" 
  ON highlight_tags FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM highlights 
    WHERE highlights.id = highlight_tags.highlight_id 
    AND highlights.user_id = auth.uid()
  ));

-- Create indexes for faster lookups
CREATE INDEX book_tags_book_id_idx ON book_tags(book_id);
CREATE INDEX book_tags_tag_id_idx ON book_tags(tag_id);
CREATE INDEX book_tags_job_action_id_idx ON book_tags(job_action_id);
CREATE INDEX highlight_tags_highlight_id_idx ON highlight_tags(highlight_id);
CREATE INDEX highlight_tags_tag_id_idx ON highlight_tags(tag_id);
CREATE INDEX highlight_tags_job_action_id_idx ON highlight_tags(job_action_id);

-- Trigger to automatically update updated_at timestamp for tags
CREATE TRIGGER update_tags_modified_timestamp
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();
