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
import { ReactNode } from 'react';
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
  return (
    <div className="flex gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 flex-1">
        <div className="flex flex-col space-y-4">
          {/* Highlight text with stylized quote marks and highlighted search matches */}
          <div className="relative font-serif">
            <div className="absolute -top-4 -left-2 text-4xl text-gray-200 dark:text-gray-700">"</div>
            <div className="relative z-10">
              <p className="text-lg leading-relaxed pl-3 py-1">
                {highlightMatches(highlight.text)}
              </p>
            </div>
            <div className="absolute -bottom-6 -right-2 text-4xl text-gray-200 dark:text-gray-700">"</div>
          </div>
          
          {/* Note if present - with highlighted search matches */}
          {highlight.note && (
            <div className="bg-muted/40 p-3 rounded-md mt-2 border-l-4 border-blue-400">
              <p className="text-sm whitespace-pre-line">
                {highlightMatches(highlight.note)}
              </p>
            </div>
          )}
          
          {/* Metadata section */}
          <div className="flex flex-wrap gap-3 pt-3 text-sm text-muted-foreground border-t">
            {/* Location */}
            {highlight.location && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{highlight.location}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Location in book</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Date highlighted */}
            {highlight.highlightedAt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{formatDate(highlight.highlightedAt)}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Date highlighted</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Readwise Tags */}
          {highlight.rwTags && highlight.rwTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1">
                <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Readwise tags:</span>
              </div>
              {highlight.rwTags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className={`text-xs cursor-pointer hover:bg-muted ${filterTag === renderTag(tag) ? 'bg-primary/10 border-primary' : ''}`}
                  onClick={() => onTagSelect(filterTag === renderTag(tag) ? null : renderTag(tag))}
                >
                  {renderTag(tag)}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Spark Tags */}
          {highlight.tags && highlight.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1">
                <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Spark tags:</span>
              </div>
              {highlight.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className={`text-xs cursor-pointer hover:bg-muted bg-primary/5 ${filterTag === tag.name ? 'bg-primary/10 border-primary' : ''}`}
                  onClick={() => onTagSelect(filterTag === tag.name ? null : tag.name)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Personal Notes Text Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 flex-1">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Personal Notes</h3>
          {isSavingNote && (
            <div className="flex items-center text-xs text-blue-500">
              <Save className="h-3 w-3 mr-1 animate-pulse" />
              Saving...
            </div>
          )}
        </div>
        <textarea 
          className="w-full h-56 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          placeholder="Add your personal notes here..."
          defaultValue={highlight.userNote || ""}
          onChange={(e) => {
            if (onUserNoteChange) {
              onUserNoteChange(highlight.id, e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
} 