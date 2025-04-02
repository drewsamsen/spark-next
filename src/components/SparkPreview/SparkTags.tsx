"use client";

import { useState } from "react";
import { Tag, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SparkDomain } from "@/lib/types";

interface SparkTagsProps {
  sparkId: string;
  tags: SparkDomain['tags'];
  onAddTag: (tag: string) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
}

/**
 * Component for displaying and managing the tags of a spark
 */
export function SparkTags({ 
  sparkId, 
  tags, 
  onAddTag, 
  onRemoveTag 
}: SparkTagsProps) {
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTag.trim()) return;
    
    try {
      await onAddTag(newTag.trim());
      setNewTag("");
      setShowTagInput(false);
    } catch (error) {
      // Error is handled in the parent component
    }
  };
  
  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5" />
        Tags
      </h4>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Badge 
            key={tag.id}
            variant="outline"
            className="text-xs group relative hover:pr-6"
          >
            {tag.name}
            <span 
              className="absolute right-1 top-0.5 opacity-0 group-hover:opacity-100 cursor-pointer text-muted-foreground hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveTag(tag.id);
              }}
            >
              <X className="h-3 w-3" />
            </span>
          </Badge>
        ))}
        
        {/* Add Tag Button */}
        {!showTagInput && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 rounded-md px-2 text-xs flex items-center gap-1"
            onClick={() => setShowTagInput(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Tag
          </Button>
        )}
      </div>
      
      {/* New Tag Input */}
      {showTagInput && (
        <form onSubmit={handleAddTag} className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Enter tag name..."
            className="text-xs px-2 py-1 border rounded flex-1"
            autoFocus
          />
          <Button 
            type="submit" 
            variant="default" 
            size="sm" 
            className="h-6 text-xs"
            disabled={!newTag.trim()}
          >
            Add
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs"
            onClick={() => {
              setShowTagInput(false);
              setNewTag("");
            }}
          >
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
} 