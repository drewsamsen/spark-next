export interface SidebarItem {
  id: string;
  name: string;
  color?: string;      // Optional - used for Sparks
  date?: string;       // Optional - Format: "MM/YY" (e.g., "8/23" for August 2023)
  highlightsCount?: number; // Optional - Number of highlights
} 