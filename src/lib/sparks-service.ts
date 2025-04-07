import { SidebarItem, EnhancedSparkItem } from "@/lib/types";
import { sparksService as serviceImpl } from "@/services/sparks.service";

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

// Re-export the interfaces for backward compatibility
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
   * Get all sparks for the current user with complete details including categories and tags
   * @deprecated Use the sparksService from '@/services/sparks.service' instead
   */
  async getSparks(): Promise<EnhancedSparkItem[]> {
    return await serviceImpl.getSparks();
  },

  /**
   * Get detailed information for a single spark
   * @deprecated Use the sparksService from '@/services/sparks.service' instead
   */
  async getSparkDetails(sparkId: string): Promise<SparkDetails | null> {
    const sparkDomain = await serviceImpl.getSparkDetails(sparkId);
    
    if (!sparkDomain) {
      return null;
    }
    
    // Map from the domain model to the legacy SparkDetails format
    return {
      id: sparkDomain.id,
      body: sparkDomain.body,
      createdAt: sparkDomain.createdAt,
      todoCreatedAt: sparkDomain.todoCreatedAt,
      categories: sparkDomain.categories,
      tags: sparkDomain.tags
    };
  }
}; 