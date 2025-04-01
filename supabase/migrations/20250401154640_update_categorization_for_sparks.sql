-- Add foreign key references from junction tables to job_actions
ALTER TABLE spark_categories
ADD CONSTRAINT fk_spark_categories_job_action
FOREIGN KEY (job_action_id) REFERENCES categorization_job_actions(id) ON DELETE SET NULL;

ALTER TABLE spark_tags
ADD CONSTRAINT fk_spark_tags_job_action
FOREIGN KEY (job_action_id) REFERENCES categorization_job_actions(id) ON DELETE SET NULL;

-- Update the reject_categorization_job function to handle sparks
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
  
  -- Remove all spark categories created by this job
  DELETE FROM spark_categories
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
  
  -- Remove all spark tags created by this job
  DELETE FROM spark_tags
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
