'use client';

import { Calendar, Users, FileText, Settings, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useContentService } from "@/hooks";
import { QuickAccessItem, ActivityItem, DocumentItem } from "@/services/content.service";

export default function MainContent() {
  const { quickAccessItems, activityItems, documentItems, isLoading } = useContentService();
  
  // Map icons to the quick access items
  const itemsWithIcons = quickAccessItems.map(item => {
    let icon;
    switch (item.title) {
      case "Calendar":
        icon = <Calendar className="h-6 w-6" />;
        break;
      case "Contacts":
        icon = <Users className="h-6 w-6" />;
        break;
      case "Documents":
        icon = <FileText className="h-6 w-6" />;
        break;
      case "Settings":
        icon = <Settings className="h-6 w-6" />;
        break;
      default:
        icon = <FileText className="h-6 w-6" />;
    }
    return { ...item, icon };
  });

  // If still loading data, show a simple loading state
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="max-w-7xl mx-auto space-y-8">
          <p className="text-muted-foreground">Loading dashboard content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to <span className="text-spark-brand dark:text-spark-dark-brand">Spark</span></h1>
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
                className="rounded-md border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-spark-primary dark:focus:ring-spark-dark-primary dark:border-spark-dark-neutral/30"
              />
            </div>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Grid section */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {itemsWithIcons.map((item, index) => (
              <div 
                key={index}
                className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow dark-card"
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
          <div className="border border-sidebar rounded-lg divide-y divide-sidebar overflow-hidden dark-card">
            {activityItems.map((item, index) => (
              <div 
                key={index}
                className="p-4 bg-background hover:bg-spark-neutral/10 dark:hover:bg-spark-dark-neutral/20 transition-colors"
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
            <Button variant="branded" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documentItems.map((item, index) => (
              <div 
                key={index} 
                className="border border-sidebar rounded-lg p-4 hover:border-spark-primary dark:hover:border-spark-dark-primary transition-colors group dark-card"
              >
                <div className={cn("h-40 rounded border border-sidebar flex items-center justify-center transition-colors mb-2", item.color)}>
                  <FileText className={cn("h-10 w-10", item.iconColor)} />
                </div>
                <h3 className="font-medium truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.updatedAt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 