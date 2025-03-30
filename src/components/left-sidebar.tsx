'use client';

import { useRef, useState, useEffect } from "react";
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
import { useUISettings, UI_SETTINGS } from "@/contexts/ui-settings-context";

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
  const { settings, updateLeftSidebarWidth } = useUISettings();
  const iconWidth = UI_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(settings.leftSidebar.width);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Update local state when settings change (but not during resize)
  useEffect(() => {
    if (!isResizing) {
      setSidebarWidth(settings.leftSidebar.width);
    }
  }, [settings.leftSidebar.width, isResizing]);

  // Handle resize
  useEffect(() => {
    if (!resizeHandleRef.current || isProjectsSidebarOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Get the new width based on mouse position
      const newWidth = e.clientX;
      
      // Apply constraints
      if (newWidth >= UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH && 
          newWidth <= UI_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate the final width directly to avoid stale state
        const finalWidth = e.clientX;
        // Apply constraints to ensure valid width
        const validWidth = Math.max(
          UI_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH,
          Math.min(finalWidth, UI_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH)
        );
        // First update local state
        setSidebarWidth(validWidth);
        // Then save to user settings
        updateLeftSidebarWidth(validWidth);
      }
      setIsResizing(false);
    };

    const resizeHandle = resizeHandleRef.current;
    resizeHandle.addEventListener('mousedown', handleMouseDown);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
    }

    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (isResizing) {
        document.body.style.cursor = '';
      }
    };
  }, [isResizing, updateLeftSidebarWidth, isProjectsSidebarOpen]);

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

  // Calculate styles for different states
  const mainSidebarStyle = isProjectsSidebarOpen
    ? { width: `${iconWidth}px`, transition: 'none' }
    : { 
        width: `${sidebarWidth}px`, 
        transition: 'none' 
      };

  return (
    <div className="h-full w-full bg-sidebar border-r z-20 relative"
         style={isProjectsSidebarOpen ? { width: `${sidebarWidth}px`, transition: 'none' } : undefined}>
      {/* Main sidebar content */}
      <div className="h-full flex flex-col" style={mainSidebarStyle}>
        <div className="h-14 flex items-center border-b px-4 md:h-[57px]"></div>
        <div className="flex-1 overflow-auto scrollbar-thin py-2">
          <nav className="grid gap-1 px-2">
            {sidebarItems.map((item) => (
              isProjectsSidebarOpen ? (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <a
                      href={item.href || "#"}
                      onClick={(e) => handleNavItemClick(item, e)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        activeSidebarItem === item.name ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground",
                        "pl-3 pr-0 justify-start w-[60px] h-[40px] relative z-[150]"
                      )}
                      aria-label={item.tooltip}
                    >
                      {item.icon}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={-20} className="z-[200]">
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
              <Tooltip delayDuration={0}>
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
                      "pl-3 pr-0 justify-start w-[60px] h-[40px] relative z-[150]"
                    )}
                    aria-label="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={-20} className="z-[200]">
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
                  activeSidebarItem === "Settings" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "",
                  "pl-3 pr-0 justify-start w-[60px] h-[40px] relative z-[150]"
                )}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Resize handle - only show when nested sidebar is closed */}
      {!isProjectsSidebarOpen && (
        <div
          ref={resizeHandleRef}
          className="absolute right-0 inset-y-0 w-2 bg-transparent hover:bg-blue-500/20 cursor-ew-resize z-30"
          title="Drag to resize"
          style={{ transition: isResizing ? 'none' : 'opacity 200ms ease-in-out' }}
        />
      )}
    </div>
  );
} 