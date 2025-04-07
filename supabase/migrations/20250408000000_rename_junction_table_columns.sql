-- Rename remaining job-related columns to automation-related columns
-- This migration completes the renaming from "automation_jobs" to "automations" 
-- and "automation_job_actions" to "automation_actions"

-- 1. Rename "job_action_id" to "automation_action_id" in all junction tables

-- For book_categories
ALTER TABLE IF EXISTS book_categories 
  RENAME COLUMN job_action_id TO automation_action_id;

-- For highlight_categories
ALTER TABLE IF EXISTS highlight_categories 
  RENAME COLUMN job_action_id TO automation_action_id;

-- For book_tags
ALTER TABLE IF EXISTS book_tags 
  RENAME COLUMN job_action_id TO automation_action_id;

-- For highlight_tags
ALTER TABLE IF EXISTS highlight_tags 
  RENAME COLUMN job_action_id TO automation_action_id;

-- For spark_categories
ALTER TABLE IF EXISTS spark_categories 
  RENAME COLUMN job_action_id TO automation_action_id;

-- For spark_tags
ALTER TABLE IF EXISTS spark_tags 
  RENAME COLUMN job_action_id TO automation_action_id;

-- 2. Rename "created_by_job_id" to "created_by_automation_id" in categories and tags

-- For categories
ALTER TABLE IF EXISTS categories 
  RENAME COLUMN created_by_job_id TO created_by_automation_id;

-- For tags
ALTER TABLE IF EXISTS tags 
  RENAME COLUMN created_by_job_id TO created_by_automation_id;

-- 3. Rename related constraints

-- Rename constraints for book_categories
ALTER TABLE IF EXISTS book_categories 
  RENAME CONSTRAINT fk_book_categories_job_action TO fk_book_categories_automation_action;

-- Rename constraints for highlight_categories
ALTER TABLE IF EXISTS highlight_categories 
  RENAME CONSTRAINT fk_highlight_categories_job_action TO fk_highlight_categories_automation_action;

-- Rename constraints for book_tags
ALTER TABLE IF EXISTS book_tags 
  RENAME CONSTRAINT fk_book_tags_job_action TO fk_book_tags_automation_action;

-- Rename constraints for highlight_tags
ALTER TABLE IF EXISTS highlight_tags 
  RENAME CONSTRAINT fk_highlight_tags_job_action TO fk_highlight_tags_automation_action;

-- Rename constraints for spark_categories
ALTER TABLE IF EXISTS spark_categories 
  RENAME CONSTRAINT fk_spark_categories_job_action TO fk_spark_categories_automation_action;

-- Rename constraints for spark_tags
ALTER TABLE IF EXISTS spark_tags 
  RENAME CONSTRAINT fk_spark_tags_job_action TO fk_spark_tags_automation_action;

-- 4. Rename related indexes

-- Rename indexes for book_categories
ALTER INDEX IF EXISTS book_categories_job_action_id_idx RENAME TO book_categories_automation_action_id_idx;

-- Rename indexes for highlight_categories
ALTER INDEX IF EXISTS highlight_categories_job_action_id_idx RENAME TO highlight_categories_automation_action_id_idx;

-- Rename indexes for book_tags
ALTER INDEX IF EXISTS book_tags_job_action_id_idx RENAME TO book_tags_automation_action_id_idx;

-- Rename indexes for highlight_tags
ALTER INDEX IF EXISTS highlight_tags_job_action_id_idx RENAME TO highlight_tags_automation_action_id_idx;

-- Rename indexes for spark_categories
ALTER INDEX IF EXISTS spark_categories_job_action_id_idx RENAME TO spark_categories_automation_action_id_idx;

-- Rename indexes for spark_tags
ALTER INDEX IF EXISTS spark_tags_job_action_id_idx RENAME TO spark_tags_automation_action_id_idx;

-- Rename indexes for categories
ALTER INDEX IF EXISTS categories_created_by_job_id_idx RENAME TO categories_created_by_automation_id_idx;

-- Rename indexes for tags
ALTER INDEX IF EXISTS tags_created_by_job_id_idx RENAME TO tags_created_by_automation_id_idx;

-- 5. Update foreign key references

-- Make sure the foreign keys reference the new automation_actions table
-- This should already be done by the previous migration, but let's make sure

-- Drop and recreate foreign key constraints to ensure they point to the right tables
ALTER TABLE IF EXISTS book_categories
  DROP CONSTRAINT IF EXISTS fk_book_categories_automation_action,
  ADD CONSTRAINT fk_book_categories_automation_action
  FOREIGN KEY (automation_action_id) REFERENCES automation_actions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS highlight_categories
  DROP CONSTRAINT IF EXISTS fk_highlight_categories_automation_action,
  ADD CONSTRAINT fk_highlight_categories_automation_action
  FOREIGN KEY (automation_action_id) REFERENCES automation_actions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS book_tags
  DROP CONSTRAINT IF EXISTS fk_book_tags_automation_action,
  ADD CONSTRAINT fk_book_tags_automation_action
  FOREIGN KEY (automation_action_id) REFERENCES automation_actions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS highlight_tags
  DROP CONSTRAINT IF EXISTS fk_highlight_tags_automation_action,
  ADD CONSTRAINT fk_highlight_tags_automation_action
  FOREIGN KEY (automation_action_id) REFERENCES automation_actions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS spark_categories
  DROP CONSTRAINT IF EXISTS fk_spark_categories_automation_action,
  ADD CONSTRAINT fk_spark_categories_automation_action
  FOREIGN KEY (automation_action_id) REFERENCES automation_actions(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS spark_tags
  DROP CONSTRAINT IF EXISTS fk_spark_tags_automation_action,
  ADD CONSTRAINT fk_spark_tags_automation_action
  FOREIGN KEY (automation_action_id) REFERENCES automation_actions(id) ON DELETE SET NULL;

-- Update foreign key references for categories and tags
ALTER TABLE IF EXISTS categories
  DROP CONSTRAINT IF EXISTS fk_categories_created_by_automation,
  ADD CONSTRAINT fk_categories_created_by_automation
  FOREIGN KEY (created_by_automation_id) REFERENCES automations(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS tags
  DROP CONSTRAINT IF EXISTS fk_tags_created_by_automation,
  ADD CONSTRAINT fk_tags_created_by_automation
  FOREIGN KEY (created_by_automation_id) REFERENCES automations(id) ON DELETE SET NULL; 