import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Create a singleton Supabase client for browser usage
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Create a server-side client (using service role key)
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for server client');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Browser client singleton
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

// Get the browser client (singleton pattern)
export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}; 