-- Migrate from fixed columns to JSONB-based approach for automation_job_actions

-- Step 1: Drop any existing constraints that reference categorization_job_actions
ALTER TABLE IF EXISTS book_categories
DROP CONSTRAINT IF EXISTS fk_book_categories_job_action;

ALTER TABLE IF EXISTS highlight_categories
DROP CONSTRAINT IF EXISTS fk_highlight_categories_job_action;

ALTER TABLE IF EXISTS book_tags
DROP CONSTRAINT IF EXISTS fk_book_tags_job_action;

ALTER TABLE IF EXISTS highlight_tags
DROP CONSTRAINT IF EXISTS fk_highlight_tags_job_action;

ALTER TABLE IF EXISTS spark_categories
DROP CONSTRAINT IF EXISTS fk_spark_categories_job_action;

ALTER TABLE IF EXISTS spark_tags
DROP CONSTRAINT IF EXISTS fk_spark_tags_job_action;

-- Drop constraints from categories and tags tables that depend on categorization_jobs
ALTER TABLE IF EXISTS categories
DROP CONSTRAINT IF EXISTS categories_created_by_job_id_fkey;

ALTER TABLE IF EXISTS tags
DROP CONSTRAINT IF EXISTS tags_created_by_job_id_fkey;

-- Reset orphaned job_action_id references to NULL
UPDATE book_categories SET job_action_id = NULL;
UPDATE highlight_categories SET job_action_id = NULL;
UPDATE book_tags SET job_action_id = NULL;
UPDATE highlight_tags SET job_action_id = NULL;
UPDATE categories SET created_by_job_id = NULL;
UPDATE tags SET created_by_job_id = NULL;

-- Also update spark tables if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'spark_categories') THEN
        EXECUTE 'UPDATE spark_categories SET job_action_id = NULL';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'spark_tags') THEN
        EXECUTE 'UPDATE spark_tags SET job_action_id = NULL';
    END IF;
END $$;

-- Step 2: Drop existing tables (no data preservation)
DROP TABLE IF EXISTS categorization_job_actions;
DROP TABLE IF EXISTS categorization_jobs;

-- Step 3: Create new tables with JSONB structure
CREATE TABLE automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE automation_job_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES automation_jobs(id) ON DELETE CASCADE,
  action_data JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'executed', 'failed', 'rejected', 'reverted')),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create index for JSONB data
CREATE INDEX idx_automation_job_actions_action_data ON automation_job_actions USING GIN (action_data);

-- Step 5: Create index on job_id for faster lookup
CREATE INDEX idx_automation_job_actions_job_id ON automation_job_actions(job_id);

-- Step 6: Create index on status for filtering
CREATE INDEX idx_automation_job_actions_status ON automation_job_actions(status);

-- Step 7: Create indexes for automation_jobs
CREATE INDEX idx_automation_jobs_user_id ON automation_jobs(user_id);
CREATE INDEX idx_automation_jobs_status ON automation_jobs(status);

-- Step 8: Recreate foreign key references from junction tables
ALTER TABLE book_categories
ADD CONSTRAINT fk_book_categories_job_action
FOREIGN KEY (job_action_id) REFERENCES automation_job_actions(id) ON DELETE SET NULL;

ALTER TABLE highlight_categories
ADD CONSTRAINT fk_highlight_categories_job_action
FOREIGN KEY (job_action_id) REFERENCES automation_job_actions(id) ON DELETE SET NULL;

ALTER TABLE book_tags
ADD CONSTRAINT fk_book_tags_job_action
FOREIGN KEY (job_action_id) REFERENCES automation_job_actions(id) ON DELETE SET NULL;

ALTER TABLE highlight_tags
ADD CONSTRAINT fk_highlight_tags_job_action
FOREIGN KEY (job_action_id) REFERENCES automation_job_actions(id) ON DELETE SET NULL;

-- Also add for spark tables if they exist
ALTER TABLE IF EXISTS spark_categories
ADD CONSTRAINT fk_spark_categories_job_action
FOREIGN KEY (job_action_id) REFERENCES automation_job_actions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS spark_tags
ADD CONSTRAINT fk_spark_tags_job_action
FOREIGN KEY (job_action_id) REFERENCES automation_job_actions(id) ON DELETE SET NULL;

-- Step 9: Enable RLS for tables
ALTER TABLE automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_job_actions ENABLE ROW LEVEL SECURITY;

-- Step 10: Create policies
CREATE POLICY "Users can view their own automation jobs"
  ON automation_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own automation job actions"
  ON automation_job_actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM automation_jobs
    WHERE automation_jobs.id = automation_job_actions.job_id
    AND automation_jobs.user_id = auth.uid()
  ));
