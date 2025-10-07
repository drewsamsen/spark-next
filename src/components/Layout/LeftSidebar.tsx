'use client';

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Book,
  Home,
  Settings,
  Sparkles,
  TagsIcon,
  FolderIcon,
  HashIcon,
  Workflow,
  Flame,
  Highlighter,
  StickyNote,
  Bug,
  FileCog2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { useSidebarService, SIDEBAR_SETTINGS } from "@/hooks";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  tooltip: string;
  href?: string;
  hasSubmenu?: boolean;
  count?: number;
}

interface LeftSidebarProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  activeSidebarItem: string | null;
  toggleProjectsSidebar: (item: string) => void;
  isProjectsSidebarOpen: boolean;
  navigateTo?: (path: string, e: React.MouseEvent) => void;
  currentPath?: string;
}

export default function LeftSidebar({
  isOpen,
  setIsOpen,
  activeSidebarItem,
  toggleProjectsSidebar,
  isProjectsSidebarOpen,
  navigateTo,
  currentPath
}: LeftSidebarProps) {
  const { 
    leftSidebarWidth, 
    updateLeftSidebarWidth,
    isLoading
  } = useSidebarService();
  const iconWidth = SIDEBAR_SETTINGS.LEFT_SIDEBAR.ICON_WIDTH;

  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(leftSidebarWidth);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Update local state when settings change (but not during resize)
  useEffect(() => {
    if (!isResizing) {
      setSidebarWidth(leftSidebarWidth);
    }
  }, [leftSidebarWidth, isResizing]);

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
      if (newWidth >= SIDEBAR_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH && 
          newWidth <= SIDEBAR_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate the final width directly to avoid stale state
        const finalWidth = e.clientX;
        // Apply constraints to ensure valid width
        const validWidth = Math.max(
          SIDEBAR_SETTINGS.LEFT_SIDEBAR.MIN_WIDTH,
          Math.min(finalWidth, SIDEBAR_SETTINGS.LEFT_SIDEBAR.MAX_WIDTH)
        );
        // First update local state
        setSidebarWidth(validWidth);
        // Then save using the service
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
      name: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      tooltip: "Dashboard",
      href: "/"
    },
    {
      name: "Highlights",
      icon: <Highlighter className="h-5 w-5" />,
      tooltip: "Highlights",
      hasSubmenu: true
    },
    {
      name: "Sparks",
      icon: <Flame className="h-5 w-5" />,
      tooltip: "Sparks",
      hasSubmenu: true
    },
    {
      name: "Notes",
      icon: <StickyNote className="h-5 w-5" />,
      tooltip: "Notes",
      hasSubmenu: true
    },
    {
      name: "Categories",
      icon: <FolderIcon className="h-5 w-5" />,
      tooltip: "Categories",
      hasSubmenu: true
    },
    {
      name: "Tags",
      icon: <TagsIcon className="h-5 w-5" />,
      tooltip: "Tags",
      hasSubmenu: true
    },
  ];

  // Utility sidebar items
  const utilitySidebarItems: NavItem[] = [
    {
      name: "Automations",
      icon: <FileCog2 />,
      count: 0,
      tooltip: "Automations",
      href: "/automations"
    },
    {
      name: "Debug",
      icon: <Bug className="h-5 w-5" />,
      tooltip: "Debug",
      href: "/debug"
    },
    {
      name: "Settings",
      icon: <Settings className="h-5 w-5" />,
      tooltip: "Settings",
      href: "/settings"
    },
  ];

  const handleNavItemClick = (item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (item.href) {
      if (navigateTo) {
        navigateTo(item.href, e);
      } else {
        // Fallback to traditional navigation
        window.location.href = item.href;
      }
    } else {
      toggleProjectsSidebar(item.name);
    }
  };

  // Don't render if sidebar is closed or if settings are still loading
  if (!isOpen || isLoading) return null;

  // Calculate styles for different states
  const mainSidebarStyle = isProjectsSidebarOpen
    ? { width: `${iconWidth}px`, transition: 'none' }
    : { 
        width: `${sidebarWidth}px`, 
        transition: 'none' 
      };

  return (
    <div className="h-screen w-full bg-neutral-50 border-r z-20 relative dark:bg-sidebar dark:border-spark-dark-neutral/20"
         style={isProjectsSidebarOpen ? { width: `${sidebarWidth}px`, transition: 'none' } : undefined}>
      {/* Main sidebar content */}
      <div className="h-full flex flex-col" style={mainSidebarStyle}>
        <div className="h-14 flex items-center border-b px-4 md:h-[57px] dark:border-spark-dark-neutral/20"></div>
        <div className="flex-1 overflow-auto scrollbar-thin py-2">
          <nav className="grid gap-1 px-2">
            {sidebarItems.map((item) => (
              isProjectsSidebarOpen ? (
                <Tooltip key={item.name} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <a
                      href={item.href || "#"}
                      onClick={(e) => handleNavItemClick(item, e)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-spark-neutral/20 hover:text-spark-primary dark:hover:bg-spark-dark-neutral/20 dark:hover:text-spark-dark-primary pl-3 pr-0 justify-start w-[60px] h-[40px] relative z-[150]"
                      aria-label={item.tooltip}
                    >
                      {item.icon}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={-10} className="z-[200] dark:bg-spark-dark-surface dark:border-spark-dark-neutral/20">
                    {item.tooltip}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <a
                  key={item.name}
                  href={item.href || "#"}
                  onClick={(e) => handleNavItemClick(item, e)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-spark-neutral/20 hover:text-spark-primary dark:hover:bg-spark-dark-neutral/20 dark:hover:text-spark-dark-primary"
                >
                  {item.icon}
                  <span>{item.name}</span>
                </a>
              )
            ))}
          </nav>
          
          {/* Utility Section */}
          <div className="mt-6">
            <div className="px-3 mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Utility</p>
            </div>
            <nav className="grid gap-1 px-2">
              {utilitySidebarItems.map((item) => (
                isProjectsSidebarOpen ? (
                  <Tooltip key={item.name} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <a
                        href={item.href || "#"}
                        onClick={(e) => handleNavItemClick(item, e)}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-spark-neutral/20 hover:text-spark-primary dark:hover:bg-spark-dark-neutral/20 dark:hover:text-spark-dark-primary pl-3 pr-0 justify-start w-[60px] h-[40px] relative z-[150]"
                        aria-label={item.tooltip}
                      >
                        {item.icon}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={-10} className="z-[200] dark:bg-spark-dark-surface dark:border-spark-dark-neutral/20">
                      {item.tooltip}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <a
                    key={item.name}
                    href={item.href || "#"}
                    onClick={(e) => handleNavItemClick(item, e)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-spark-neutral/20 hover:text-spark-primary dark:hover:bg-spark-dark-neutral/20 dark:hover:text-spark-dark-primary"
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                )
              ))}
            </nav>
          </div>
          
          <div className="mt-auto" />
        </div>
      </div>
      
      {/* Resize handle visible when not in projects mode */}
      {!isProjectsSidebarOpen && (
        <div
          ref={resizeHandleRef}
          className="absolute top-0 right-0 h-full w-1 cursor-ew-resize opacity-0 hover:opacity-100 hover:bg-spark-primary/50 dark:hover:bg-spark-dark-primary/50 transition-opacity"
        />
      )}
    </div>
  );
} 