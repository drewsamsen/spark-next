'use client';

import { ReactNode } from 'react';

interface HighlightTextWithMatchesProps {
  text: string;
  searchTerm: string;
}

/**
 * Component to highlight search matches within text
 */
export function HighlightTextWithMatches({ text, searchTerm }: HighlightTextWithMatchesProps): ReactNode {
  if (!searchTerm || !text) return <>{text}</>;
  
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const parts = [];
  
  let lastIndex = 0;
  let index = lowerText.indexOf(lowerSearch);
  
  while (index !== -1) {
    // Add the text before the match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }
    
    // Add the matched text with highlighting
    parts.push(
      <span key={`match-${index}`} className="bg-primary/30 text-primary-foreground px-0.5 rounded">
        {text.substring(index, index + searchTerm.length)}
      </span>
    );
    
    lastIndex = index + searchTerm.length;
    index = lowerText.indexOf(lowerSearch, lastIndex);
  }
  
  // Add the remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return <>{parts}</>;
} 