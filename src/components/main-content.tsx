'use client';

import { Calendar, Users, FileText, Settings, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MainContent() {
  // Example data for grid cards
  const items = [
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Calendar",
      description: "View and manage your schedule",
      color: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Contacts",
      description: "Manage your network connections",
      color: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Documents",
      description: "View and edit your documents",
      color: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Settings",
      description: "Customize your experience",
      color: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
    }
  ];

  // Example data for list items
  const listItems = [
    {
      title: "Create a new project",
      description: "Set up a new project workspace with customizable templates",
      date: "Today",
      status: "In Progress",
      statusColor: "bg-blue-500"
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
      statusColor: "bg-amber-500"
    },
    {
      title: "Plan marketing campaign",
      description: "Develop strategy for Q4 product launch",
      date: "1 week ago",
      status: "In Review",
      statusColor: "bg-purple-500"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Spark</h1>
            <p className="text-muted-foreground">
              Your intelligent workspace for personal knowledge management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search in dashboard..."
                className="rounded-md border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Grid section */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, index) => (
              <div 
                key={index}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-full", item.color)}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* List section */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Recent Activities</h2>
          <div className="border rounded-lg divide-y overflow-hidden">
            {listItems.map((item, index) => (
              <div 
                key={index}
                className="p-4 bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                    <span className={cn("inline-block w-2 h-2 rounded-full", item.statusColor)}></span>
                    <span className="text-xs font-medium">{item.status}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent documents section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Documents</h2>
            <Button variant="outline" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="h-40 rounded border flex items-center justify-center bg-accent/30 mb-2">
                <FileText className="h-10 w-10 text-muted-foreground/70" />
              </div>
              <h3 className="font-medium truncate">Project Proposal.pdf</h3>
              <p className="text-xs text-muted-foreground">Updated 2 hours ago</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="h-40 rounded border flex items-center justify-center bg-accent/30 mb-2">
                <FileText className="h-10 w-10 text-muted-foreground/70" />
              </div>
              <h3 className="font-medium truncate">Meeting Notes.docx</h3>
              <p className="text-xs text-muted-foreground">Updated yesterday</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
              <div className="h-40 rounded border flex items-center justify-center bg-accent/30 mb-2">
                <FileText className="h-10 w-10 text-muted-foreground/70" />
              </div>
              <h3 className="font-medium truncate">Research Data.xlsx</h3>
              <p className="text-xs text-muted-foreground">Updated 3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 