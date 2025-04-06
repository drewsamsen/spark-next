-- Add status column to categorization_job_actions
ALTER TABLE categorization_job_actions 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'executing', 'executed', 'failed', 'rejected', 'reverted'));

-- Add executed_at timestamp to categorization_job_actions
ALTER TABLE categorization_job_actions
ADD COLUMN executed_at TIMESTAMPTZ DEFAULT NULL;

-- Update existing job actions to have 'executed' status if they were from approved jobs
UPDATE categorization_job_actions
SET status = 'executed', executed_at = NOW()
WHERE job_id IN (
  SELECT id FROM categorization_jobs WHERE status = 'approved'
);

-- Update existing job actions to have 'rejected' status if they were from rejected jobs
UPDATE categorization_job_actions
SET status = 'rejected'
WHERE job_id IN (
  SELECT id FROM categorization_jobs WHERE status = 'rejected'
);

-- Add index on status column for performance
CREATE INDEX idx_categorization_job_actions_status ON categorization_job_actions(status);
