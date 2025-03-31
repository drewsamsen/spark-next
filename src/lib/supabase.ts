import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import fs from 'fs';
import path from 'path';

// Create a singleton Supabase client for browser usage
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'supabase.auth.token',
      detectSessionInUrl: true
    }
  });
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
    }
  });
};

// Browser client singleton
let browserClient: ReturnType<typeof createBrowserClient> | null = null;
// Keep track of the URL used to create the client to detect env changes
let lastSupabaseUrl: string | null = null;

// Get the browser client (singleton pattern)
export const getSupabaseBrowserClient = () => {
  const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  
  // Check if we need to reset the client because the URL changed or we're in a different environment
  if (!browserClient || lastSupabaseUrl !== currentUrl) {
    // Clean up any existing instance
    if (browserClient) {
      console.log('Supabase client URL changed, resetting client');
    }
    
    // Create a new client instance
    browserClient = createBrowserClient();
    lastSupabaseUrl = currentUrl;
    
    // Don't automatically sign out on client creation - this clears legitimate sessions
    // when moving between pages or on refresh
  }
  
  return browserClient;
};

// Force reset the browser client - useful for troubleshooting
export const resetSupabaseBrowserClient = async () => {
  // Clear local storage items related to Supabase
  if (typeof window !== 'undefined') {
    // First, attempt to sign out through any existing client
    if (browserClient) {
      try {
        await browserClient.auth.signOut();
      } catch (error) {
        console.error('Error signing out during client reset:', error);
      }
    }
    
    // Clear localStorage items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') || 
        key.includes('supabase') || 
        key.includes('auth')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove the keys we found
    keysToRemove.forEach(key => {
      console.log(`Removing localStorage key: ${key}`);
      localStorage.removeItem(key);
    });
    
    // Force browser client to be re-created on next call
    browserClient = null;
    lastSupabaseUrl = null;
    
    console.log('Supabase browser client has been reset');
  }
  
  return true;
}; 