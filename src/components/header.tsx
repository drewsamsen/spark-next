'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MenuIcon,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  Blocks,
  PlusSquare,
  Search,
  Bell,
  BadgeHelp,
  Settings
} from "lucide-react";
import { ModeToggle } from "@/components/theme/ModeToggle";

interface HeaderProps {
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
}

export default function Header({ toggleLeftSidebar, toggleRightSidebar }: HeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleLeftSidebar} className="h-8 w-8">
            <MenuIcon className="h-4 w-4" />
            <span className="sr-only">Toggle left sidebar</span>
          </Button>
          
          <div className="flex items-center gap-1">
            <Blocks className="h-5 w-5" />
            <span className="font-medium text-lg hidden md:inline-block">Spark</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Dashboard</span>
          </div>
        </div>
        
        {/* Center section */}
        <div className="flex-1 flex justify-center px-4 max-w-3xl mx-auto">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full rounded-md border bg-background pl-9 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <BadgeHelp className="h-4 w-4" />
            <span className="sr-only">Help</span>
          </Button>
          
          <ModeToggle />
          
          <Button variant="ghost" size="icon" onClick={toggleRightSidebar} className="h-8 w-8">
            <PanelRightOpen className="h-4 w-4" />
            <span className="sr-only">Toggle right sidebar</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-1">
            <PlusSquare className="h-4 w-4" />
            <span className="hidden md:inline-block">New</span>
          </Button>
        </div>
      </div>
    </header>
  );
} 