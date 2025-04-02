import { getRepositories } from '@/repositories';
import { handleServiceItemError } from '@/lib/errors';

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