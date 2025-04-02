import { getRepositories } from '@/repositories';
import { handleServiceItemError } from '@/lib/errors';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Type for auth user data
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Type for auth session data
 */
export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

/**
 * Type for auth change callback
 */
export type AuthChangeCallback = (session: AuthSession | null) => void;

/**
 * Service for handling authentication operations
 */
export const authService = {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string): Promise<AuthSession | null> {
    try {
      const repo = getRepositories().auth;
      
      const authData = await repo.signInWithPassword(email, password);
      
      if (!authData.session) {
        return null;
      }
      
      return {
        user: {
          id: authData.session.user.id,
          email: authData.session.user.email || '',
        },
        token: authData.session.access_token,
        expiresAt: new Date(authData.session.expires_at || '').getTime(),
      };
    } catch (error) {
      return handleServiceItemError<AuthSession>(error, 'Error in authService.signInWithPassword');
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<boolean> {
    try {
      const repo = getRepositories().auth;
      
      await repo.signOut();
      return true;
    } catch (error) {
      console.error('Error in authService.signOut:', error);
      return false;
    }
  },

  /**
   * Get the current session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const repo = getRepositories().auth;
      
      const session = await repo.getSession();
      
      if (!session) {
        return null;
      }
      
      // Handle expires_at date carefully to avoid format issues
      let expiresAt = 0;
      try {
        if (session.expires_at) {
          // Ensure expiresAt is a valid number (milliseconds since epoch)
          expiresAt = typeof session.expires_at === 'string' 
            ? new Date(session.expires_at).getTime() 
            : session.expires_at;
          
          // If conversion failed or produced NaN, use a far-future timestamp
          if (isNaN(expiresAt)) {
            console.warn('Invalid expires_at format:', session.expires_at);
            // Set to 1 hour from now as fallback
            expiresAt = Date.now() + (60 * 60 * 1000);
          }
        } else {
          // No expiration provided, set to 1 hour from now
          expiresAt = Date.now() + (60 * 60 * 1000);
        }
      } catch (err) {
        console.error('Error parsing expires_at:', err);
        // Fallback to 1 hour from now
        expiresAt = Date.now() + (60 * 60 * 1000);
      }
      
      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
        },
        token: session.access_token,
        expiresAt
      };
    } catch (error) {
      return handleServiceItemError<AuthSession>(error, 'Error in authService.getSession');
    }
  },

  /**
   * Check if a user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getSession();
      return !!session?.user?.id;
    } catch (error) {
      console.error('Error in authService.isAuthenticated:', error);
      return false;
    }
  },

  /**
   * Validate a token and get the associated user
   */
  async validateToken(token: string): Promise<{ data: { user: AuthUser | null }, error: string | null }> {
    try {
      const repo = getRepositories().auth;
      const result = await repo.validateToken(token);
      
      if (result.error || !result.data.user) {
        return {
          data: { user: null },
          error: result.error || 'Invalid token'
        };
      }
      
      return {
        data: {
          user: {
            id: result.data.user.id,
            email: result.data.user.email || ''
          }
        },
        error: null
      };
    } catch (error) {
      console.error('Error in authService.validateToken:', error);
      return {
        data: { user: null },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Subscribe to auth state changes
   * @param callback Function to call when auth state changes
   * @returns Function to unsubscribe
   */
  onAuthStateChange(callback: AuthChangeCallback): { unsubscribe: () => void } {
    const repo = getRepositories().auth;
    
    try {
      const { data: { subscription } } = repo.onAuthStateChange(
        (event: AuthChangeEvent, supabaseSession: Session | null) => {
          if (supabaseSession) {
            // Convert to our AuthSession format
            const session: AuthSession = {
              user: {
                id: supabaseSession.user.id,
                email: supabaseSession.user.email || '',
              },
              token: supabaseSession.access_token,
              expiresAt: new Date(supabaseSession.expires_at || '').getTime(),
            };
            callback(session);
          } else {
            callback(null);
          }
        }
      );
      
      return subscription;
    } catch (error) {
      console.error('Error in authService.onAuthStateChange:', error);
      // Return a dummy unsubscribe function
      return {
        unsubscribe: () => {}
      };
    }
  },

  /**
   * Reset the auth client state (useful for troubleshooting)
   */
  async resetClient(): Promise<boolean> {
    try {
      const repo = getRepositories().auth;
      
      await repo.resetClient();
      return true;
    } catch (error) {
      console.error('Error in authService.resetClient:', error);
      return false;
    }
  }
}; 