-- Add run_id column to function_logs if it doesn't exist
ALTER TABLE public.function_logs
ADD COLUMN IF NOT EXISTS run_id TEXT;

-- Create an index on run_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_function_logs_run_id ON public.function_logs(run_id);

-- Add a unique constraint on function_id + run_id combination
-- First, make sure we don't have duplicate entries that would violate the constraint
-- (This might be necessary for tables with existing data)
DO $$
BEGIN
  -- Handle any existing duplicates
  -- Keep only the earliest entry for each function_id + run_id combination
  WITH duplicates AS (
    SELECT id, function_id, run_id,
           ROW_NUMBER() OVER (PARTITION BY function_id, run_id ORDER BY started_at) as row_num
    FROM public.function_logs
    WHERE run_id IS NOT NULL AND function_id IS NOT NULL
  )
  DELETE FROM public.function_logs
  WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
  );
  
  -- Update any NULL run_id values to a generated unique value
  -- This ensures the constraint can be applied without losing data
  UPDATE public.function_logs
  SET run_id = 'legacy-' || id::text
  WHERE run_id IS NULL;
END $$;

-- Add the unique constraint
ALTER TABLE public.function_logs
ADD CONSTRAINT function_logs_function_id_run_id_unique UNIQUE (function_id, run_id);

-- Add a helpful comment about the constraint
COMMENT ON CONSTRAINT function_logs_function_id_run_id_unique ON public.function_logs
IS 'Ensures that each function execution is logged only once by enforcing uniqueness on function_id + run_id';

-- Update existing rows to have consistent run_id values based on function_id and created_at
-- This is helpful for historical data without explicit run_id values
UPDATE public.function_logs
SET run_id = 'legacy-' || id::text
WHERE run_id IS NULL OR run_id = '';
