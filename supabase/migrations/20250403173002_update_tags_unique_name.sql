-- First, clean up existing tag names by trimming whitespace, replacing spaces with dashes, and lowercasing
UPDATE tags
SET name = LOWER(REPLACE(TRIM(name), ' ', '-'));

-- Then add a unique constraint on name and user_id to ensure users can't have duplicate tag names
-- We need to include user_id in the constraint to allow different users to use the same tag names
ALTER TABLE tags 
ADD CONSTRAINT tags_name_user_id_unique UNIQUE (name, user_id);

-- Create a function to standardize tag names on insert and update
CREATE OR REPLACE FUNCTION standardize_tag_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = LOWER(REPLACE(TRIM(NEW.name), ' ', '-'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to enforce standardized tag names
CREATE TRIGGER standardize_tag_name_on_insert
BEFORE INSERT ON tags
FOR EACH ROW
EXECUTE FUNCTION standardize_tag_name();

CREATE TRIGGER standardize_tag_name_on_update
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION standardize_tag_name(); 