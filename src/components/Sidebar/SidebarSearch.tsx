'use client';

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ChangeEvent } from "react";

interface SidebarSearchProps {
  title: string;
  searchTerm: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
}

/**
 * Search component for sidebars
 */
export function SidebarSearch({ 
  title, 
  searchTerm, 
  onSearchChange, 
  isLoading = false 
}: SidebarSearchProps) {
  return (
    <div className="p-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={`Search ${title.toLowerCase()}...`}
          className="w-full rounded-md pl-8 text-sm"
          value={searchTerm}
          onChange={onSearchChange}
          disabled={isLoading}
        />
      </div>
    </div>
  );
} 