'use client';

import { HighlightSearchResult, HighlightTag } from '@/lib/types';
import { Tag as TagIcon, BookOpen, CalendarDays, Save, Sparkles } from 'lucide-react';
import { ReactNode, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface SearchResultCardProps {
  highlight: HighlightSearchResult;
  renderTag: (tag: HighlightTag) => string;
  formatDate: (dateString: string | null) => string;
  highlightMatches: (text: string) => ReactNode;
  filterTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onUserNoteChange?: (highlightId: string, note: string) => void;
  isSavingNote?: boolean;
  searchMode?: 'keyword' | 'semantic' | 'hybrid';
}

/**
 * Component for displaying a search result highlight with book information and relevance score
 */
export function SearchResultCard({
  highlight,
  renderTag,
  formatDate,
  highlightMatches,
  filterTag,
  onTagSelect,
  onUserNoteChange,
  isSavingNote = false,
  searchMode = 'keyword'
}: SearchResultCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState(highlight.userNote || "");
  
  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`;
    }
  };
  
  useEffect(() => {
    adjustTextareaHeight();
  }, [note]);
  
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  // Format score for display
  const formatScore = (score?: number) => {
    if (!score) return null;
    
    if (searchMode === 'keyword') {
      // For keyword search, score is rank (lower is better)
      return `Rank ${Math.round(score)}`;
    } else {
      // For semantic/hybrid, score is similarity (0-1, higher is better)
      // Convert to percentage
      const percentage = Math.round(score * 100);
      return `${percentage}% match`;
    }
  };

  const scoreLabel = formatScore(highlight.score);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Book header with cover, title, author, and score */}
      {highlight.book && (
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Book cover */}
            {highlight.book.coverImageUrl ? (
              <Link 
                href={`/highlights/${highlight.rwId}`}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <div className="relative w-12 h-16 rounded overflow-hidden shadow-md">
                  <Image
                    src={highlight.book.coverImageUrl}
                    alt={highlight.book.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              </Link>
            ) : (
              <Link 
                href={`/highlights/${highlight.rwId}`}
                className="flex-shrink-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-12 h-16 rounded bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center shadow-md">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
              </Link>
            )}
            
            {/* Book details */}
            <div className="flex-1 min-w-0">
              <Link 
                href={`/highlights/${highlight.rwId}`}
                className="hover:underline"
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {highlight.book.title}
                </h3>
              </Link>
              {highlight.book.author && (
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {highlight.book.author}
                </p>
              )}
            </div>

            {/* Relevance score */}
            {scoreLabel && (
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                {scoreLabel}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row">
        {/* Highlight side */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
          {/* Highlight text with subtle styling */}
          <div className="mb-6">
            <p className="text-lg font-serif leading-relaxed text-gray-800 dark:text-gray-200">
              {highlightMatches(highlight.text)}
            </p>
          </div>
          
          {/* Original note if present */}
          {highlight.note && (
            <div className="mb-5 pl-3 border-l-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm italic text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {highlightMatches(highlight.note)}
              </p>
            </div>
          )}
          
          {/* Metadata section - minimal styling */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-3 mt-auto">
            {/* Location */}
            {highlight.location && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{highlight.location}</span>
              </div>
            )}
            
            {/* Date highlighted */}
            {highlight.highlightedAt && (
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{formatDate(highlight.highlightedAt)}</span>
              </div>
            )}
            
            {/* Tags - simplified */}
            {highlight.tags && highlight.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <TagIcon className="h-3.5 w-3.5" />
                {highlight.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className={`text-xs cursor-pointer hover:text-blue-600 ${filterTag === tag.name ? 'text-blue-500 font-medium' : ''}`}
                    onClick={() => onTagSelect(filterTag === tag.name ? null : tag.name)}
                  >
                    {tag.name}
                    {index < (highlight.tags?.length ?? 0) - 1 && ","}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Notes side - styled like notebook paper */}
        <div className="flex-1 bg-[#fffffe] dark:bg-gray-850 relative">
          {/* Subtle lined paper effect - extends with content */}
          <div className="absolute inset-0 pointer-events-none notes-lines">
            {Array.from({ length: 50 }).map((_, i) => (
              <div 
                key={i} 
                className="w-full h-px bg-blue-50 dark:bg-gray-800"
                style={{ top: `${(i + 1) * 24}px`, position: 'absolute' }}
              />
            ))}
          </div>
          
          {/* Notes textarea with minimal styling */}
          <div className="p-6 relative z-10 min-h-full">
            {/* Absolutely positioned saving indicator */}
            {isSavingNote && (
              <div className="absolute top-2 right-6 z-20 flex items-center text-blue-500 text-xs">
                <Save className="h-3 w-3 mr-1 animate-pulse" />
                Saving...
              </div>
            )}
            <textarea 
              ref={textareaRef}
              className="w-full bg-transparent resize-none border-0 p-0 focus:outline-none focus:ring-0 text-gray-700 dark:text-gray-300 font-light overflow-hidden"
              placeholder="Add your notes..."
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (onUserNoteChange) {
                  onUserNoteChange(highlight.id, e.target.value);
                }
              }}
              style={{ lineHeight: '24px', minHeight: '200px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

