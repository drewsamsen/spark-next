import { getSupabaseBrowserClient } from "@/lib/supabase";
import { SidebarItem } from "@/lib/types";

/**
 * Formats a date in "MMM 'YY" format (e.g., "Mar '23")
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  // Get abbreviated month name (Jan, Feb, etc.)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString().slice(2);
  
  return `${month} '${year}`;
}

// Export the sparks service
export const sparksService = {
  /**
   * Get all sparks for the current user
   */
  async getSparks(): Promise<SidebarItem[]> {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('User not authenticated');
        return [];
      }
      
      // Fetch sparks from the database
      const { data, error } = await supabase
        .from('sparks')
        .select('id, body, todo_created_at, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching sparks:', error);
        return [];
      }
      
      // Convert to SidebarItem format
      return data.map(spark => ({
        id: spark.id,
        name: spark.body,
        date: formatDate(spark.todo_created_at || spark.created_at)
      }));
    } catch (error) {
      console.error('Error in getSparks:', error);
      return [];
    }
  }
}; 