-- Find and print information about existing constraints
DO $$
DECLARE
  constraint_info RECORD;
BEGIN
  FOR constraint_info IN
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'automations'::regclass
  LOOP
    RAISE NOTICE 'Constraint %: %', constraint_info.conname, constraint_info.def;
  END LOOP;
END $$;

-- Add 'reverted' to the check constraint in automations table using a more direct approach
ALTER TABLE automations 
DROP CONSTRAINT IF EXISTS automation_jobs_status_check;

-- Create the new constraint with reverted status included
ALTER TABLE automations
ADD CONSTRAINT automation_jobs_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'reverted'));

-- Verify the changes worked
DO $$
DECLARE
  count_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_rows FROM pg_constraint 
  WHERE conrelid = 'automations'::regclass 
  AND pg_get_constraintdef(oid) LIKE '%reverted%';
  
  IF count_rows = 0 THEN
    RAISE EXCEPTION 'Failed to add reverted status to constraint!';
  ELSE
    RAISE NOTICE 'Successfully modified constraint to include reverted status';
  END IF;
END $$; 