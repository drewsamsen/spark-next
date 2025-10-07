/**
 * Authentication hooks
 * 
 * Note: We use useAuthSession which follows the service layer architecture
 * (repository → service → hook). This ensures consistent data access patterns
 * and proper abstraction from Supabase implementation details.
 */

export { useAuthSession } from './use-auth-session';
