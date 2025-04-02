import { contentRepository } from '@/repositories/content.repository';
import { ReactNode } from 'react';

// Types for the content service
export interface QuickAccessItem {
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}

export interface ActivityItem {
  title: string;
  description: string;
  date: string;
  status: string;
  statusColor: string;
}

export interface DocumentItem {
  title: string;
  updatedAt: string;
  color: string;
  iconColor: string;
}

/**
 * Service for handling content-related functionality
 */
export const contentService = {
  /**
   * Get quick access items for dashboard display
   * Currently returns demo data, but in the future will pull from user data
   */
  getQuickAccessItems(): QuickAccessItem[] {
    // In a future implementation, this would use contentRepository.getQuickAccessItems()
    // and transform the data as needed
    
    // For now, return static demo data - these will be populated with icons in the component
    return [
      {
        icon: null, // Will be set in the component
        title: "Calendar",
        description: "View and manage your schedule",
        color: "bg-spark-primary/20 dark:bg-spark-dark-primary/30 text-spark-primary dark:text-spark-dark-primary"
      },
      {
        icon: null, // Will be set in the component
        title: "Contacts",
        description: "Manage your network connections",
        color: "bg-spark-brand/20 dark:bg-spark-dark-brand/30 text-spark-brand dark:text-spark-dark-brand"
      },
      {
        icon: null, // Will be set in the component
        title: "Documents",
        description: "View and edit your documents",
        color: "bg-spark-secondary/20 dark:bg-spark-dark-secondary/30 text-spark-secondary dark:text-spark-dark-secondary"
      },
      {
        icon: null, // Will be set in the component
        title: "Settings",
        description: "Customize your experience",
        color: "bg-spark-neutral/20 dark:bg-spark-dark-neutral/30 text-spark-neutral dark:text-spark-dark-neutral"
      }
    ];
  },
  
  /**
   * Get recent activity items
   * Currently returns demo data, but in the future will pull from recent user actions
   */
  getRecentActivities(): ActivityItem[] {
    // In a future implementation, this would use contentRepository.getRecentItems()
    // and transform the data as needed
    
    // For now, return static demo data
    return [
      {
        title: "Create a new project",
        description: "Set up a new project workspace with customizable templates",
        date: "Today",
        status: "In Progress",
        statusColor: "bg-spark-primary dark:bg-spark-dark-primary"
      },
      {
        title: "Review analytics dashboard",
        description: "Analyze monthly performance metrics and create report",
        date: "Yesterday",
        status: "Completed",
        statusColor: "bg-green-500"
      },
      {
        title: "Update documentation",
        description: "Revise and update user guides for recent feature changes",
        date: "3 days ago",
        status: "Pending",
        statusColor: "bg-spark-brand dark:bg-spark-dark-brand"
      },
      {
        title: "Plan marketing campaign",
        description: "Develop strategy for Q4 product launch",
        date: "1 week ago",
        status: "In Review",
        statusColor: "bg-spark-secondary dark:bg-spark-dark-secondary"
      }
    ];
  },
  
  /**
   * Get recent documents
   * Currently returns demo data, but in the future will pull from user documents
   */
  getRecentDocuments(): DocumentItem[] {
    // In a future implementation, this would use contentRepository.getRecentDocuments()
    // and transform the data as needed
    
    // For now, return static demo data
    return [
      {
        title: "Project Proposal.pdf",
        updatedAt: "Updated 2 hours ago",
        color: "bg-spark-primary/10 dark:bg-spark-dark-primary/20 group-hover:bg-spark-primary/20 dark:group-hover:bg-spark-dark-primary/30",
        iconColor: "text-spark-primary/70 dark:text-spark-dark-primary/80"
      },
      {
        title: "Meeting Notes.docx",
        updatedAt: "Updated yesterday",
        color: "bg-spark-brand/10 dark:bg-spark-dark-brand/20 group-hover:bg-spark-brand/20 dark:group-hover:bg-spark-dark-brand/30",
        iconColor: "text-spark-brand/70 dark:text-spark-dark-brand/80"
      },
      {
        title: "Research Data.xlsx",
        updatedAt: "Updated 3 days ago",
        color: "bg-spark-secondary/10 dark:bg-spark-dark-secondary/20 group-hover:bg-spark-secondary/20 dark:group-hover:bg-spark-dark-secondary/30",
        iconColor: "text-spark-secondary/70 dark:text-spark-dark-secondary/80"
      }
    ];
  }
}; 