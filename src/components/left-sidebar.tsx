'use client';

import { cn } from "@/lib/utils";
import {
  Book,
  Home,
  Upload,
  FileText,
  Settings,
  Calendar,
  MessagesSquare,
  PlusCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface LeftSidebarProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  activeSidebarItem: string | null;
  toggleProjectsSidebar: (item: string) => void;
  isProjectsSidebarOpen: boolean;
}

export default function LeftSidebar({
  isOpen,
  setIsOpen,
  activeSidebarItem,
  toggleProjectsSidebar,
  isProjectsSidebarOpen
}: LeftSidebarProps) {
  // Sidebar items configuration
  const sidebarItems = [
    {
      name: "Home",
      icon: <Home className="h-5 w-5" />,
      tooltip: "Home"
    },
    {
      name: "Books",
      icon: <Book className="h-5 w-5" />,
      tooltip: "Books",
      hasSubmenu: true
    },
    {
      name: "Sparks",
      icon: <Sparkles className="h-5 w-5" />,
      tooltip: "Sparks",
      hasSubmenu: true
    },
    {
      name: "Upload",
      icon: <Upload className="h-5 w-5" />,
      tooltip: "Upload",
      href: "/upload"
    },
    {
      name: "Documents",
      icon: <FileText className="h-5 w-5" />,
      tooltip: "Documents"
    },
    {
      name: "Calendar",
      icon: <Calendar className="h-5 w-5" />,
      tooltip: "Calendar"
    },
    {
      name: "Messages",
      icon: <MessagesSquare className="h-5 w-5" />,
      tooltip: "Messages"
    },
  ];

  const bottomItems = [
    {
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      tooltip: "Settings"
    },
    {
      name: "New Item",
      icon: <PlusCircle className="h-5 w-5" />,
      tooltip: "Create new item"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="h-full w-full bg-sidebar border-r flex flex-col overflow-hidden">
      {/* Sidebar content */}
      <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin">
        {/* Top items */}
        <nav className="flex flex-col items-start px-2 py-4 gap-1">
          {sidebarItems.map((item) => (
            <Tooltip key={item.name} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center justify-center h-10 w-full transition-colors",
                    isProjectsSidebarOpen && item.hasSubmenu && activeSidebarItem === item.name
                      ? "bg-sidebar-accent/50 text-foreground"
                      : activeSidebarItem === item.name
                      ? "bg-sidebar-accent text-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                  onClick={() => {
                    if (item.hasSubmenu) {
                      toggleProjectsSidebar(item.name);
                    } else {
                      toggleProjectsSidebar(item.name);
                    }
                  }}
                >
                  <span className="sr-only">{item.name}</span>
                  <div className="flex items-center">
                    {item.icon}
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.tooltip}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </div>

      {/* Bottom items */}
      <nav className="flex flex-col items-start px-2 py-4 border-t gap-1">
        {bottomItems.map((item) => (
          <Tooltip key={item.name} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center justify-center h-10 w-full transition-colors",
                  activeSidebarItem === item.name
                    ? "bg-sidebar-accent text-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
                onClick={() => toggleProjectsSidebar(item.name)}
              >
                <span className="sr-only">{item.name}</span>
                <div className="flex items-center">
                  {item.icon}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.tooltip}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </div>
  );
} 