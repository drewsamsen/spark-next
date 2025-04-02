'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ChangeEvent } from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Search bar component for filtering highlights
 */
export function SearchBar({ searchTerm, onSearchChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search highlights..."
        className="pl-8"
        value={searchTerm}
        onChange={onSearchChange}
      />
    </div>
  );
} 