export interface SidebarItem {
  id: string;
  rwId?: number;       // Optional - used for books to store the Readwise ID
  name: string;
  color?: string;      // Optional - used for Sparks
  date?: string;       // Optional - Format: "MM/YY" (e.g., "8/23" for August 2023)
  highlightsCount?: number; // Optional - Number of highlights
} 