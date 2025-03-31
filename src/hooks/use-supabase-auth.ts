import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    
    // Get initial session
    const checkSession = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data && data.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        setError(err instanceof Error ? err : new Error('Failed to get session'));
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );
    
    // Cleanup on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  return { session, loading, error };
} 