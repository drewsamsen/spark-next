-- Create function_logs table to track Inngest function executions
CREATE TABLE IF NOT EXISTS public.function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  function_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  input_params JSONB,
  result_data JSONB,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add RLS policies
ALTER TABLE public.function_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all function logs (for admin access)
CREATE POLICY "Service role can access all function logs"
  ON public.function_logs
  FOR ALL
  TO service_role
  USING (true);

-- Allow users to see their own function logs
CREATE POLICY "Users can see their own function logs"
  ON public.function_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_function_logs_function_name ON public.function_logs(function_name);
CREATE INDEX idx_function_logs_status ON public.function_logs(status);
CREATE INDEX idx_function_logs_user_id ON public.function_logs(user_id);
CREATE INDEX idx_function_logs_started_at ON public.function_logs(started_at DESC);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatically updating updated_at
CREATE TRIGGER update_function_logs_updated_at
BEFORE UPDATE ON public.function_logs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
