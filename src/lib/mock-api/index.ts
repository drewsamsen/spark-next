import { SidebarItem } from "./types";
import { booksData, sparksData } from "./data";

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API implementation
export const mockApi = {
  // Books API
  async getBooks(): Promise<SidebarItem[]> {
    // Simulate network delay (1500-2000ms)
    await delay(1500 + Math.random() * 500);
    
    try {
      return booksData;
    } catch (error) {
      console.error('Error fetching books:', error);
      return [];
    }
  },

  // Sparks API
  async getSparks(): Promise<SidebarItem[]> {
    // Simulate network delay (1500-2000ms)
    await delay(1500 + Math.random() * 500);
    
    try {
      return sparksData;
    } catch (error) {
      console.error('Error fetching sparks:', error);
      return [];
    }
  }
}; 