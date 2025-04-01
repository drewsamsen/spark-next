-- Create sparks table
CREATE TABLE IF NOT EXISTS sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  todo_created_at TIMESTAMPTZ,
  todo_id TEXT UNIQUE,
  md5_uid TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to sparks table
ALTER TABLE sparks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own sparks
CREATE POLICY "Users can only view their own sparks" 
  ON sparks FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own sparks
CREATE POLICY "Users can insert their own sparks" 
  ON sparks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own sparks
CREATE POLICY "Users can update their own sparks" 
  ON sparks FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own sparks
CREATE POLICY "Users can delete their own sparks" 
  ON sparks FOR DELETE 
  USING (auth.uid() = user_id);
  
-- Create indexes for faster queries
CREATE INDEX sparks_user_id_idx ON sparks(user_id);
CREATE INDEX sparks_todo_id_idx ON sparks(todo_id);
CREATE INDEX sparks_md5_uid_idx ON sparks(md5_uid);
CREATE INDEX sparks_body_idx ON sparks USING gin(to_tsvector('english', body));

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_sparks_modified_timestamp
BEFORE UPDATE ON sparks
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();
