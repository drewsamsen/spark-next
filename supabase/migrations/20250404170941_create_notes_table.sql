-- Create notes table for storing user notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own notes
CREATE POLICY "Users can only view their own notes" 
  ON notes FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own notes
CREATE POLICY "Users can insert their own notes" 
  ON notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own notes
CREATE POLICY "Users can update their own notes" 
  ON notes FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own notes
CREATE POLICY "Users can delete their own notes" 
  ON notes FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX notes_user_id_idx ON notes(user_id);
CREATE INDEX notes_content_idx ON notes USING gin(to_tsvector('english', content));
CREATE INDEX notes_title_idx ON notes USING gin(to_tsvector('english', title));

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_notes_modified_timestamp
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();

-- Create junction tables for connecting notes to other resources

-- Books to notes
CREATE TABLE IF NOT EXISTS book_notes (
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, note_id)
);

-- Highlights to notes
CREATE TABLE IF NOT EXISTS highlight_notes (
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (highlight_id, note_id)
);

-- Sparks to notes
CREATE TABLE IF NOT EXISTS spark_notes (
  spark_id UUID NOT NULL REFERENCES sparks(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (spark_id, note_id)
);

-- Add RLS to junction tables
ALTER TABLE book_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for book_notes
CREATE POLICY "Users can only view their own book notes" 
  ON book_notes FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = book_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own book notes" 
  ON book_notes FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = book_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own book notes" 
  ON book_notes FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = book_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

-- Create policies for highlight_notes
CREATE POLICY "Users can only view their own highlight notes" 
  ON highlight_notes FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = highlight_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own highlight notes" 
  ON highlight_notes FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = highlight_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own highlight notes" 
  ON highlight_notes FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = highlight_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

-- Create policies for spark_notes
CREATE POLICY "Users can only view their own spark notes" 
  ON spark_notes FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = spark_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own spark notes" 
  ON spark_notes FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = spark_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own spark notes" 
  ON spark_notes FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = spark_notes.note_id 
    AND notes.user_id = auth.uid()
  ));

-- Create indexes for faster lookups
CREATE INDEX book_notes_book_id_idx ON book_notes(book_id);
CREATE INDEX book_notes_note_id_idx ON book_notes(note_id);
CREATE INDEX highlight_notes_highlight_id_idx ON highlight_notes(highlight_id);
CREATE INDEX highlight_notes_note_id_idx ON highlight_notes(note_id);
CREATE INDEX spark_notes_spark_id_idx ON spark_notes(spark_id);
CREATE INDEX spark_notes_note_id_idx ON spark_notes(note_id);
