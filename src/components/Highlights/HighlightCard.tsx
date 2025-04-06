'use client';

import { HighlightDomain } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tag as TagIcon, BookOpen, CalendarDays, Save } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ReactNode, useRef, useEffect, useState } from 'react';
import { Tag } from '@/lib/books-service';

interface HighlightCardProps {
  highlight: HighlightDomain;
  renderTag: (tag: Tag) => string;
  formatDate: (dateString: string | null) => string;
  highlightMatches: (text: string) => ReactNode;
  filterTag: string | null;
  onTagSelect: (tag: string | null) => void;
  onUserNoteChange?: (highlightId: string, note: string) => void;
  isSavingNote?: boolean;
}

/**
 * Component for displaying a single highlight with all its details
 */
export function HighlightCard({
  highlight,
  renderTag,
  formatDate,
  highlightMatches,
  filterTag,
  onTagSelect,
  onUserNoteChange,
  isSavingNote = false
}: HighlightCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState(highlight.userNote || "");
  
  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to scrollHeight to expand to content
      textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`;
    }
  };
  
  // Adjust height initially and when note changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [note]);
  
  // Also adjust when component mounts
  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
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
              placeholder=""
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