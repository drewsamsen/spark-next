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

// Extended interface that combines SidebarItem with SparkDetails
export interface EnhancedSparkItem extends SidebarItem {
  details: SparkDetails;
}

// Export the sparks service
export const sparksService = {
  /**
   * Get all sparks for the current user with complete details including categories and tags
   */
  async getSparks(): Promise<EnhancedSparkItem[]> {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('User not authenticated');
        return [];
      }

      // Fetch sparks with their categories and tags using foreign tables
      const { data: sparksData, error } = await supabase
        .from('sparks')
        .select(`
          id, 
          body, 
          todo_created_at, 
          created_at,
          categories:spark_categories(
            category:categories(id, name)
          ),
          tags:spark_tags(
            tag:tags(id, name)
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching sparks:', error);
        return [];
      }

      // Transform the nested data into the expected format
      const enhancedSparks: EnhancedSparkItem[] = sparksData.map(spark => {
        // Extract categories from the nested structure
        const categories: SparkCategory[] = [];
        if (spark.categories && Array.isArray(spark.categories)) {
          spark.categories.forEach(catRel => {
            if (catRel.category && typeof catRel.category === 'object' && 
                'id' in catRel.category && 'name' in catRel.category) {
              categories.push({
                id: String(catRel.category.id),
                name: String(catRel.category.name)
              });
            }
          });
        }

        // Extract tags from the nested structure  
        const tags: SparkTag[] = [];
        if (spark.tags && Array.isArray(spark.tags)) {
          spark.tags.forEach(tagRel => {
            if (tagRel.tag && typeof tagRel.tag === 'object' && 
                'id' in tagRel.tag && 'name' in tagRel.tag) {
              tags.push({
                id: String(tagRel.tag.id),
                name: String(tagRel.tag.name)
              });
            }
          });
        }

        return {
          id: spark.id,
          name: spark.body,
          date: formatDate(spark.todo_created_at || spark.created_at),
          details: {
            id: spark.id,
            body: spark.body,
            createdAt: spark.created_at,
            todoCreatedAt: spark.todo_created_at,
            categories,
            tags
          }
        };
      });

      return enhancedSparks;
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

      // Fetch the spark with all related data in a single query
      const { data: sparkData, error: sparkError } = await supabase
        .from('sparks')
        .select(`
          id, 
          body, 
          todo_created_at, 
          created_at,
          categories:spark_categories(
            category:categories(id, name)
          ),
          tags:spark_tags(
            tag:tags(id, name)
          )
        `)
        .eq('id', sparkId)
        .eq('user_id', session.user.id)
        .single();
      
      if (sparkError || !sparkData) {
        console.error('Error fetching spark:', sparkError);
        return null;
      }

      // Extract categories from the nested structure
      const categories: SparkCategory[] = [];
      if (sparkData.categories && Array.isArray(sparkData.categories)) {
        sparkData.categories.forEach(catRel => {
          if (catRel.category && typeof catRel.category === 'object' && 
              'id' in catRel.category && 'name' in catRel.category) {
            categories.push({
              id: String(catRel.category.id),
              name: String(catRel.category.name)
            });
          }
        });
      }

      // Extract tags from the nested structure
      const tags: SparkTag[] = [];
      if (sparkData.tags && Array.isArray(sparkData.tags)) {
        sparkData.tags.forEach(tagRel => {
          if (tagRel.tag && typeof tagRel.tag === 'object' && 
              'id' in tagRel.tag && 'name' in tagRel.tag) {
            tags.push({
              id: String(tagRel.tag.id),
              name: String(tagRel.tag.name)
            });
          }
        });
      }

      // Construct the spark details
      const sparkDetails: SparkDetails = {
        id: sparkData.id,
        body: sparkData.body,
        createdAt: sparkData.created_at,
        todoCreatedAt: sparkData.todo_created_at,
        categories,
        tags
      };

      return sparkDetails;
    } catch (error) {
      console.error('Error in getSparkDetails:', error);
      return null;
    }
  }
}; 