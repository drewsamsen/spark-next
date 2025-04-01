import { getSupabaseBrowserClient, createServerClient } from '@/lib/supabase';
import { AuthError, DatabaseError } from '@/lib/errors';
import { type SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types';

/**
 * Type for Supabase client
 */
export type DbClient = SupabaseClient<Database>;

/**
 * Get the appropriate Supabase client (browser or server)
 * @param serverSide Whether to use the server client (defaults to false)
 * @param adminAccess Whether to use admin privileges (only for server)
 * @returns Supabase client
 */
export function getDbClient(serverSide: boolean = false, adminAccess: boolean = false): DbClient {
  if (serverSide) {
    return createServerClient();
  }
  return getSupabaseBrowserClient();
}

/**
 * Get the current user ID from the session
 * @param supabase Supabase client
 * @returns The current user ID
 * @throws AuthError if the user is not authenticated
 */
export async function getCurrentUserId(supabase: DbClient): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new AuthError();
  }
  
  return session.user.id;
}

/**
 * Execute a database transaction
 * @param supabase Supabase client
 * @param operations Function containing all operations to perform within the transaction
 * @returns Result of the operations
 * @throws DatabaseError if the transaction fails
 */
export async function withTransaction<T>(
  supabase: DbClient, 
  operations: (client: DbClient) => Promise<T>
): Promise<T> {
  try {
    // Since Supabase doesn't directly support transactions in the JS client,
    // we just execute the operations normally for now
    // In a real implementation with raw SQL, we would use BEGIN/COMMIT/ROLLBACK
    return await operations(supabase);
  } catch (error) {
    throw new DatabaseError('Transaction failed', error);
  }
}

/**
 * A utility function to format date strings consistently
 * Format: "MMM 'YY" (e.g., "Jun '23")
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().slice(2);
  
  return `${month} '${year}`;
} 