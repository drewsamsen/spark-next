-- Enable realtime functionality for the function_logs table
-- This allows clients to subscribe to changes using Supabase Realtime

-- Ensure the function_logs table is included in realtime publication
-- This is the key part that enables the postgres_changes feature
ALTER publication supabase_realtime ADD TABLE public.function_logs;

-- No need for custom triggers or RLS policies with this simpler approach
-- The Supabase client will use the postgres_changes API directly 