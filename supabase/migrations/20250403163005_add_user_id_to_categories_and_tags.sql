-- Migration: Add user_id to categories and tags tables
-- Description: Adds user_id to categories and tags tables and assigns existing records to the first user

-- First, add the user_id column to the categories table
ALTER TABLE categories 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Then add the user_id column to the tags table
ALTER TABLE tags
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Get the user ID from the profiles table (assuming there's only one user)
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Get the ID of the first user from the profiles table
  SELECT id INTO first_user_id FROM profiles LIMIT 1;

  -- Update all existing categories to be owned by this user
  UPDATE categories SET user_id = first_user_id;
  
  -- Update all existing tags to be owned by this user
  UPDATE tags SET user_id = first_user_id;

  -- Output the user ID for logging purposes
  RAISE NOTICE 'Updated categories and tags with user_id: %', first_user_id;
END $$;

-- Now make the user_id column NOT NULL since all records have values
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tags ALTER COLUMN user_id SET NOT NULL;

-- Update the Row Level Security policies to use the user_id column

-- For categories table
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;
CREATE POLICY "Users can view their own categories" 
  ON categories FOR SELECT 
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Only authenticated users can create categories" ON categories;
CREATE POLICY "Users can create their own categories" 
  ON categories FOR INSERT 
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own categories" 
  ON categories FOR UPDATE 
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own categories" 
  ON categories FOR DELETE 
  TO authenticated USING (user_id = auth.uid());

-- For tags table
DROP POLICY IF EXISTS "Everyone can view tags" ON tags;
CREATE POLICY "Users can view their own tags" 
  ON tags FOR SELECT 
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Only authenticated users can create tags" ON tags;
CREATE POLICY "Users can create their own tags" 
  ON tags FOR INSERT 
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tags" 
  ON tags FOR UPDATE 
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tags" 
  ON tags FOR DELETE 
  TO authenticated USING (user_id = auth.uid());

-- Create indexes for the new columns for better performance
CREATE INDEX categories_user_id_idx ON categories(user_id);
CREATE INDEX tags_user_id_idx ON tags(user_id);
