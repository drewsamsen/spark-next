-- Rename 'automation_jobs' table to 'automations'
ALTER TABLE IF EXISTS automation_jobs RENAME TO automations;

-- Rename 'automation_job_actions' table to 'automation_actions'
ALTER TABLE IF EXISTS automation_job_actions RENAME TO automation_actions;

-- Update the foreign key reference in automation_actions
ALTER TABLE IF EXISTS automation_actions 
  RENAME COLUMN job_id TO automation_id;

-- Update indexes for automation_actions
ALTER INDEX IF EXISTS idx_automation_job_actions_action_data RENAME TO idx_automation_actions_action_data;
ALTER INDEX IF EXISTS idx_automation_job_actions_job_id RENAME TO idx_automation_actions_automation_id;
ALTER INDEX IF EXISTS idx_automation_job_actions_status RENAME TO idx_automation_actions_status;

-- Update indexes for automations
ALTER INDEX IF EXISTS idx_automation_jobs_user_id RENAME TO idx_automations_user_id;
ALTER INDEX IF EXISTS idx_automation_jobs_status RENAME TO idx_automations_status;

-- Update RLS policies
ALTER POLICY "Users can view their own automation jobs" 
  ON automations
  RENAME TO "Users can view their own automations";

ALTER POLICY "Users can view their own automation job actions" 
  ON automation_actions
  RENAME TO "Users can view their own automation actions";
