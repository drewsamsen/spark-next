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
  Sparkles,
  Inbox,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

interface LeftSidebarProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  activeSidebarItem: string | null;
  toggleProjectsSidebar: (item: string) => void;
  isProjectsSidebarOpen: boolean;
}

// Nav item interface
interface NavItem {
  name: string;
  icon: React.ReactNode;
  tooltip: string;
  hasSubmenu?: boolean;
  href?: string;
}

export default function LeftSidebar({
  isOpen,
  setIsOpen,
  activeSidebarItem,
  toggleProjectsSidebar,
  isProjectsSidebarOpen
}: LeftSidebarProps) {
  // Sidebar items configuration
  const sidebarItems: NavItem[] = [
    {
      name: "Inbox",
      icon: <Inbox className="h-5 w-5" />,
      tooltip: "Inbox"
    },
    {
      name: "Upload",
      icon: <Upload className="h-5 w-5" />,
      tooltip: "Upload",
      href: "/upload"
    },
    {
      name: "Books",
      icon: <Book className="h-5 w-5" />,
      tooltip: "Books",
      hasSubmenu: true
    },
    {
      name: "Documents",
      icon: <FileText className="h-5 w-5" />,
      tooltip: "Documents"
    },
    {
      name: "Sparks",
      icon: <Sparkles className="h-5 w-5" />,
      tooltip: "Sparks",
      hasSubmenu: true
    },
    {
      name: "Synthesize",
      icon: <Zap className="h-5 w-5" />,
      tooltip: "Synthesize"
    },
  ];

  const handleNavItemClick = (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (item.href) {
      // Handle navigation to external routes
      window.location.href = item.href;
    } else {
      toggleProjectsSidebar(item.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-full bg-sidebar border-r transition-all duration-300 ease-in-out z-10">
      <div className="flex h-full flex-col">
        <div className="h-14 flex items-center border-b px-4 md:h-[57px]"></div>
        <div className="flex-1 overflow-auto scrollbar-thin py-2">
          <nav className="grid gap-1 px-2">
            {sidebarItems.map((item) => (
              isProjectsSidebarOpen ? (
                <Tooltip key={item.name} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <a
                      href={item.href || "#"}
                      onClick={(e) => handleNavItemClick(item, e)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        activeSidebarItem === item.name ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
                        "pl-3 pr-0 justify-start w-[60px]"
                      )}
                    >
                      {item.icon}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={5}>
                    {item.tooltip}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <a
                  key={item.name}
                  href={item.href || "#"}
                  onClick={(e) => handleNavItemClick(item, e)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    activeSidebarItem === item.name ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              )
            ))}
          </nav>
          <div className="mt-auto" />
          <div className="mt-4 grid gap-1 px-2">
            {isProjectsSidebarOpen ? (
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleProjectsSidebar("Settings");
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      activeSidebarItem === "Settings" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "",
                      "pl-3 pr-0 justify-start w-[60px]"
                    )}
                  >
                    <Settings className="h-5 w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  Settings
                </TooltipContent>
              </Tooltip>
            ) : (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toggleProjectsSidebar("Settings");
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  activeSidebarItem === "Settings" ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                )}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 