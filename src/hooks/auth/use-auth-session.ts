import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import { AuthSession } from '@/lib/types';

/**
 * Custom hook to manage authentication session
 */
export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    // Get initial session
    const checkSession = async () => {
      setLoading(true);
      try {
        const authSession = await authService.getSession();
        setSession(authSession);
      } catch (err) {
        console.error('Error getting auth session:', err);
        setError(err instanceof Error ? err : new Error('Failed to get auth session'));
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const subscription = authService.onAuthStateChange((authSession) => {
      setSession(authSession);
      setLoading(false);
    });
    
    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return { session, loading, error };
} 