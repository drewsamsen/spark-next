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

// Spark interfaces
export interface SparkDetails {
  id: string;
  body: string;
  createdAt: string;
  todoCreatedAt: string | null;
  categories: SparkCategory[];
  tags: SparkTag[];
}

export interface SparkCategory {
  id: string;
  name: string;
}

export interface SparkTag {
  id: string;
  name: string;
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
  },

  /**
   * Get detailed information for a single spark
   */
  async getSparkDetails(sparkId: string): Promise<SparkDetails | null> {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('User not authenticated');
        return null;
      }
      
      // Fetch the spark
      const { data: sparkData, error: sparkError } = await supabase
        .from('sparks')
        .select('id, body, todo_created_at, created_at, user_id')
        .eq('id', sparkId)
        .eq('user_id', session.user.id)
        .single();
      
      if (sparkError || !sparkData) {
        console.error('Error fetching spark:', sparkError);
        return null;
      }

      // Initialize spark details
      const sparkDetails: SparkDetails = {
        id: sparkData.id,
        body: sparkData.body,
        createdAt: sparkData.created_at,
        todoCreatedAt: sparkData.todo_created_at,
        categories: [],
        tags: []
      };

      // Fetch categories
      const { data: categoryRelations, error: categoryError } = await supabase
        .from('spark_categories')
        .select('category_id')
        .eq('spark_id', sparkId);

      if (!categoryError && categoryRelations && categoryRelations.length > 0) {
        const categoryIds = categoryRelations.map(rel => rel.category_id);
        
        const { data: categories, error: categoriesFetchError } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', categoryIds);
          
        if (!categoriesFetchError && categories) {
          sparkDetails.categories = categories.map(cat => ({
            id: cat.id,
            name: cat.name
          }));
        }
      }

      // Fetch tags
      const { data: tagRelations, error: tagError } = await supabase
        .from('spark_tags')
        .select('tag_id')
        .eq('spark_id', sparkId);

      if (!tagError && tagRelations && tagRelations.length > 0) {
        const tagIds = tagRelations.map(rel => rel.tag_id);
        
        const { data: tags, error: tagsFetchError } = await supabase
          .from('tags')
          .select('id, name')
          .in('id', tagIds);
          
        if (!tagsFetchError && tags) {
          sparkDetails.tags = tags.map(tag => ({
            id: tag.id,
            name: tag.name
          }));
        }
      }

      return sparkDetails;
    } catch (error) {
      console.error('Error in getSparkDetails:', error);
      return null;
    }
  }
}; 