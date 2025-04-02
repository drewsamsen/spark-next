import { BaseRepository } from './base.repository';
import { DbClient } from '@/lib/db';
import { AuthError } from '@/lib/errors';

/**
 * Repository for authentication operations
 */
export class AuthRepository extends BaseRepository {
  constructor(client: DbClient) {
    super(client);
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new AuthError(error.message, error);
    }
    
    return data;
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    
    if (error) {
      throw new AuthError(error.message, error);
    }
    
    return true;
  }

  /**
   * Get the current session
   */
  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      throw new AuthError(error.message, error);
    }
    
    if (!data.session) {
      console.log('No session found in auth.repository.getSession');
      return null;
    }
    
    // Log session info for debugging
    console.log('Session found in auth.repository:', {
      userId: data.session.user.id,
      expiresAt: data.session.expires_at,
      accessToken: data.session.access_token ? '[SET]' : '[NOT SET]'
    });
    
    return data.session;
  }

  /**
   * Reset the auth client state (useful for troubleshooting)
   */
  async resetClient() {
    // Reset the auth client - implementation depends on how resetSupabaseBrowserClient is implemented
    // For now, we'll call signOut which should clear most state
    await this.signOut();
    return true;
  }
} 