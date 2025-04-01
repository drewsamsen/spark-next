-- Track AI categorization jobs
CREATE TABLE IF NOT EXISTS categorization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Job name/description
  source TEXT NOT NULL, -- 'ai', 'manual', etc.
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track individual category/tag assignments
CREATE TABLE IF NOT EXISTS categorization_job_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES categorization_jobs(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- No CHECK constraint, allowing any action type
  resource_type TEXT NOT NULL, -- No CHECK constraint, allowing any resource type
  resource_id UUID NOT NULL,
  category_id UUID REFERENCES categories(id),
  tag_id UUID REFERENCES tags(id),
  category_name TEXT, -- Store category name for creation actions
  tag_name TEXT, -- Store tag name for creation actions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Removed valid_action_target constraint for flexibility
);

-- Add columns to track which job created each category/tag
ALTER TABLE categories 
ADD COLUMN created_by_job_id UUID REFERENCES categorization_jobs(id) ON DELETE SET NULL;

ALTER TABLE tags 
ADD COLUMN created_by_job_id UUID REFERENCES categorization_jobs(id) ON DELETE SET NULL;

-- Add foreign key references from junction tables to job_actions
-- This happens after both tables are created, and provides the link back from a tag/category to the job
ALTER TABLE book_categories
ADD CONSTRAINT fk_book_categories_job_action
FOREIGN KEY (job_action_id) REFERENCES categorization_job_actions(id) ON DELETE SET NULL;

ALTER TABLE highlight_categories
ADD CONSTRAINT fk_highlight_categories_job_action
FOREIGN KEY (job_action_id) REFERENCES categorization_job_actions(id) ON DELETE SET NULL;

ALTER TABLE book_tags
ADD CONSTRAINT fk_book_tags_job_action
FOREIGN KEY (job_action_id) REFERENCES categorization_job_actions(id) ON DELETE SET NULL;

ALTER TABLE highlight_tags
ADD CONSTRAINT fk_highlight_tags_job_action
FOREIGN KEY (job_action_id) REFERENCES categorization_job_actions(id) ON DELETE SET NULL;

-- Add RLS
ALTER TABLE categorization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_job_actions ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own categorization jobs"
  ON categorization_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own categorization jobs"
  ON categorization_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own categorization jobs"
  ON categorization_jobs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own categorization job actions"
  ON categorization_job_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM categorization_jobs
    WHERE categorization_jobs.id = categorization_job_actions.job_id
    AND categorization_jobs.user_id = auth.uid()
  ));

-- Add indexes
CREATE INDEX categorization_jobs_user_id_idx ON categorization_jobs(user_id);
CREATE INDEX categorization_jobs_status_idx ON categorization_jobs(status);
CREATE INDEX categorization_job_actions_job_id_idx ON categorization_job_actions(job_id);
CREATE INDEX categorization_job_actions_resource_id_idx ON categorization_job_actions(resource_id);
CREATE INDEX categories_created_by_job_id_idx ON categories(created_by_job_id);
CREATE INDEX tags_created_by_job_id_idx ON tags(created_by_job_id);

-- Function to approve an entire job and update junction tables
CREATE OR REPLACE FUNCTION approve_categorization_job(job_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the job status
  UPDATE categorization_jobs
  SET status = 'approved'
  WHERE id = job_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject and undo an entire job
CREATE OR REPLACE FUNCTION reject_categorization_job(job_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Update the job status
  UPDATE categorization_jobs
  SET status = 'rejected'
  WHERE id = job_id_param;
  
  -- Remove all book categories created by this job
  DELETE FROM book_categories
  WHERE job_action_id IN (
    SELECT id FROM categorization_job_actions
    WHERE job_id = job_id_param AND action_type IN ('add_category', 'create_category')
  );
  
  -- Remove all highlight categories created by this job
  DELETE FROM highlight_categories
  WHERE job_action_id IN (
    SELECT id FROM categorization_job_actions
    WHERE job_id = job_id_param AND action_type IN ('add_category', 'create_category')
  );
  
  -- Remove all book tags created by this job
  DELETE FROM book_tags
  WHERE job_action_id IN (
    SELECT id FROM categorization_job_actions
    WHERE job_id = job_id_param AND action_type IN ('add_tag', 'create_tag')
  );
  
  -- Remove all highlight tags created by this job
  DELETE FROM highlight_tags
  WHERE job_action_id IN (
    SELECT id FROM categorization_job_actions
    WHERE job_id = job_id_param AND action_type IN ('add_tag', 'create_tag')
  );
  
  -- Delete categories created by this job
  DELETE FROM categories
  WHERE created_by_job_id = job_id_param;
  
  -- Delete tags created by this job
  DELETE FROM tags
  WHERE created_by_job_id = job_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to update timestamps
CREATE TRIGGER update_categorization_jobs_timestamp
BEFORE UPDATE ON categorization_jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();

CREATE TRIGGER update_categorization_job_actions_timestamp
BEFORE UPDATE ON categorization_job_actions
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();
