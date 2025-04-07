-- Add 'reverted' to the allowed status values for automations table
ALTER TABLE automations 
DROP CONSTRAINT IF EXISTS automations_status_check,
ADD CONSTRAINT automations_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'reverted'));

-- Update policy permissions if needed
-- First drop the existing policy
DROP POLICY IF EXISTS "Users can view their own automations" ON automations;

-- Then create it again
CREATE POLICY "Users can view their own automations" 
  ON automations FOR SELECT
  USING (user_id = auth.uid()); 