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

  // Reset resize handlers when nested sidebar state changes
  useEffect(() => {
    // When the nested sidebar closes, we need to ensure resize handlers are reattached
    if (!isProjectsSidebarOpen && resizeHandleRef.current) {
      // Force a refresh of the resize handler
      const currentHandle = resizeHandleRef.current;
      
      // Trigger a small timeout to allow the DOM to update
      setTimeout(() => {
        if (currentHandle) {
          // Simulate a mouse leave and enter to refresh the event binding
          const leaveEvent = new MouseEvent('mouseleave');
          const enterEvent = new MouseEvent('mouseenter');
          currentHandle.dispatchEvent(leaveEvent);
          currentHandle.dispatchEvent(enterEvent);
        }
      }, 50);
    }
  }, [isProjectsSidebarOpen]);

  // Handle resize
  useEffect(() => {
    if (!resizeHandleRef.current) return;

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
      // Add cursor styling to the entire document during resize
      document.body.style.cursor = 'ew-resize';
    }

    return () => {
      resizeHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Reset cursor
      if (isResizing) {
        document.body.style.cursor = '';
      }
    };
  }, [isResizing, updateLeftSidebarWidth]);

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

  // Always use the full sidebar width, regardless of nested sidebar state
  const sidebarStyle = { 
    width: `${sidebarWidth}px`, 
    transition: isResizing ? 'none' : 'width 300ms ease-in-out' 
  };

  return (
    <div className="h-full w-full bg-sidebar border-r transition-all duration-300 ease-in-out z-10 relative">
      {/* Main sidebar content */}
      <div className="h-full flex flex-col" style={sidebarStyle}>
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
      
      {/* Resize handle - always render regardless of sidebar mode */}
      <div
        ref={resizeHandleRef}
        className="absolute right-0 inset-y-0 w-2 bg-transparent hover:bg-blue-500/20 cursor-ew-resize z-30"
        title="Drag to resize"
        style={{ transition: isResizing ? 'none' : 'opacity 200ms ease-in-out' }}
      />
    </div>
  );
} 