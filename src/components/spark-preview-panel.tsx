"use client";

import { useState, useEffect, useRef } from "react";
import { SparkDetails, sparksService } from "@/lib/sparks-service";
import { X, Tag, Plus, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toast } from "react-toastify";

interface SparkPreviewPanelProps {
  sparkId: string | null;
  onClose: () => void;
  position: { top: number; right: number };
}

export default function SparkPreviewPanel({ 
  sparkId, 
  onClose,
  position
}: SparkPreviewPanelProps) {
  const [sparkDetails, setSparkDetails] = useState<SparkDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelWidth = 350; // Same as w-[350px]
  const panelMaxHeight = 450; // Same as max-h-[450px]

  useEffect(() => {
    if (sparkId) {
      fetchSparkDetails(sparkId);
    } else {
      setSparkDetails(null);
    }
  }, [sparkId]);
  
  // Adjust position to stay in viewport
  useEffect(() => {
    // Default to the provided position
    const newPosition = {...position};
    
    // Make sure the panel doesn't go below the viewport
    const windowHeight = window.innerHeight;
    const bottomEdge = position.top + panelMaxHeight;
    
    if (bottomEdge > windowHeight) {
      // Move the panel up to fit in the viewport
      newPosition.top = Math.max(0, windowHeight - panelMaxHeight);
    }
    
    // No need to adjust right position anymore since we're using left
    
    setAdjustedPosition(newPosition);
  }, [position, panelMaxHeight]);

  const fetchSparkDetails = async (id: string) => {
    setLoading(true);
    try {
      const details = await sparksService.getSparkDetails(id);
      setSparkDetails(details);
    } catch (error) {
      console.error("Error fetching spark details:", error);
      toast.error("Failed to load spark details");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Close panel when mouse leaves
    onClose();
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sparkId || !newTag.trim() || !sparkDetails) return;
    
    try {
      const supabase = getSupabaseBrowserClient();
      
      // First check if the tag exists
      const { data: existingTags } = await supabase
        .from('tags')
        .select('id, name')
        .ilike('name', newTag.trim())
        .limit(1);

      let tagId: string;
      
      if (existingTags && existingTags.length > 0) {
        // Use existing tag
        tagId = existingTags[0].id;
      } else {
        // Create new tag
        const { data: newTagData, error: createError } = await supabase
          .from('tags')
          .insert({ name: newTag.trim() })
          .select('id')
          .single();
          
        if (createError || !newTagData) {
          throw new Error("Failed to create tag");
        }
        
        tagId = newTagData.id;
      }
      
      // Create relationship between spark and tag
      const { error: relationError } = await supabase
        .from('spark_tags')
        .insert({
          spark_id: sparkId,
          tag_id: tagId,
          created_by: 'user'
        });
        
      if (relationError) {
        throw new Error("Failed to add tag to spark");
      }
      
      // Update local state
      setSparkDetails(prev => {
        if (!prev) return null;
        
        // Check if tag already exists to avoid duplicates
        const tagExists = prev.tags.some(tag => tag.name.toLowerCase() === newTag.trim().toLowerCase());
        
        if (tagExists) {
          return prev;
        }
        
        return {
          ...prev,
          tags: [...prev.tags, { id: tagId, name: newTag.trim() }]
        };
      });
      
      setNewTag("");
      setShowTagInput(false);
      toast.success("Tag added successfully");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!sparkId || !sparkDetails) return;
    
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Remove the relationship
      const { error } = await supabase
        .from('spark_tags')
        .delete()
        .eq('spark_id', sparkId)
        .eq('tag_id', tagId);
        
      if (error) {
        throw new Error("Failed to remove tag");
      }
      
      // Update local state
      setSparkDetails(prev => {
        if (!prev) return null;
        return {
          ...prev,
          tags: prev.tags.filter(tag => tag.id !== tagId)
        };
      });
      
      toast.success("Tag removed");
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (!sparkId || !sparkDetails) return null;

  return (
    <div 
      ref={panelRef}
      className="fixed bg-white dark:bg-slate-800 shadow-xl border-2 border-slate-200 dark:border-slate-700 rounded-md overflow-hidden flex flex-col w-[350px] max-h-[450px] spark-preview-panel"
      style={{ 
        top: `${adjustedPosition.top}px`, 
        left: `${adjustedPosition.right}px`,
        zIndex: -5 // Lower z-index to ensure it's behind both sidebars
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Content with close button in the corner */}
      <div className="p-4 flex-1 overflow-auto relative">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6 absolute top-2 right-2 opacity-70 hover:opacity-100"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse">Loading...</div>
          </div>
        ) : (
          <>
            {/* Spark Body Text */}
            <div className="mb-4 pr-8">
              <p className="text-sm">{sparkDetails.body}</p>
            </div>
            
            {/* Date Info */}
            <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {sparkDetails.todoCreatedAt 
                  ? formatDate(sparkDetails.todoCreatedAt) 
                  : formatDate(sparkDetails.createdAt)}
              </span>
            </div>
            
            {/* Categories */}
            {sparkDetails.categories.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {sparkDetails.categories.map(category => (
                    <Badge 
                      key={category.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tags */}
            <div className="mb-4">
              <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {sparkDetails.tags.map(tag => (
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
                        handleRemoveTag(tag.id);
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
          </>
        )}
      </div>
    </div>
  );
} 