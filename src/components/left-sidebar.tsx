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
  HashIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { useSidebarService, SIDEBAR_SETTINGS } from "@/hooks/use-sidebar-service";

interface NavItem {
  name: string;
  icon: React.ReactNode;
  tooltip: string;
  href?: string;
  hasSubmenu?: boolean;
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
      href: "/dashboard"
    },
    {
      name: "Highlights",
      icon: <Book className="h-5 w-5" />,
      tooltip: "Highlights",
      hasSubmenu: true
    },
    {
      name: "Sparks",
      icon: <Sparkles className="h-5 w-5" />,
      tooltip: "Sparks",
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
      icon: <HashIcon className="h-5 w-5" />,
      tooltip: "Tags",
      hasSubmenu: true
    },
    {
      name: "Context Jobs",
      icon: <TagsIcon className="h-5 w-5" />,
      tooltip: "Context Jobs",
      href: "/context-jobs"
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
    <div className="h-full w-full bg-neutral-50 border-r z-20 relative dark:bg-sidebar dark:border-spark-dark-neutral/20"
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
          <div className="mt-auto" />
          <div className="mt-4 grid gap-1 px-2">
            {isProjectsSidebarOpen ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <a
                    href="/settings"
                    onClick={(e) => {
                      if (navigateTo) {
                        e.preventDefault();
                        navigateTo("/settings", e);
                      }
                    }}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-spark-neutral/20 hover:text-spark-primary dark:hover:bg-spark-dark-neutral/20 dark:hover:text-spark-dark-primary pl-3 pr-0 justify-start w-[60px] h-[40px] relative z-[150]"
                    aria-label="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={-10} className="z-[200] dark:bg-spark-dark-surface dark:border-spark-dark-neutral/20">
                  Settings
                </TooltipContent>
              </Tooltip>
            ) : (
              <a
                href="/settings"
                onClick={(e) => {
                  if (navigateTo) {
                    e.preventDefault();
                    navigateTo("/settings", e);
                  }
                }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-spark-neutral/20 hover:text-spark-primary dark:hover:bg-spark-dark-neutral/20 dark:hover:text-spark-dark-primary"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </a>
            )}
          </div>
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