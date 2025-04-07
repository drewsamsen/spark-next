-- Drop all existing policies related to automations
DROP POLICY IF EXISTS "Users can view their own automations" ON automations;
DROP POLICY IF EXISTS "Users can update their own automations" ON automations;
DROP POLICY IF EXISTS "Users can insert their own automations" ON automations;
DROP POLICY IF EXISTS "Users can delete their own automations" ON automations;
DROP POLICY IF EXISTS "Service role can access all automations" ON automations;

-- Create proper policies with appropriate permissions
-- Allow users to select their own automations
CREATE POLICY "Users can view their own automations"
  ON automations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to update their own automations
CREATE POLICY "Users can update their own automations"
  ON automations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own automations
CREATE POLICY "Users can insert their own automations"
  ON automations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own automations
CREATE POLICY "Users can delete their own automations"
  ON automations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role to do anything with automations
CREATE POLICY "Service role can access all automations"
  ON automations
  FOR ALL
  TO service_role
  USING (true);

-- Verify the policies are correctly set up
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'automations';
  
  IF policy_count < 4 THEN
    RAISE WARNING 'Expected at least 4 policies for automations table, but found %', policy_count;
  ELSE
    RAISE NOTICE 'Successfully set up % policies for automations table', policy_count;
  END IF;
END $$; 