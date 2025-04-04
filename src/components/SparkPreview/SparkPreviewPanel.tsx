"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { SparkDomain } from "@/lib/types";
import { useSparksService, useCategorization, useResourceHelper } from "@/hooks";
import {
  SparkContent,
  SparkCategories,
  SparkTags,
  adjustPanelPosition,
  formatDate
} from ".";

interface SparkPreviewPanelProps {
  sparkId: string | null;
  onClose: () => void;
  position: { top: number; right: number };
  sparkDetails?: SparkDomain | null;
}

export default function SparkPreviewPanel({ 
  sparkId, 
  onClose,
  position,
  sparkDetails: initialSparkDetails = null
}: SparkPreviewPanelProps) {
  const [sparkDetails, setSparkDetails] = useState<SparkDomain | null>(initialSparkDetails);
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelWidth = 350; // Same as w-[350px]
  const panelMaxHeight = 450; // Same as max-h-[450px]
  
  // Get services using hooks
  const { getSparkDetails } = useSparksService();
  const { tags: tagService } = useCategorization();
  const { createSparkResource } = useResourceHelper();

  // Load spark details when ID changes
  useEffect(() => {
    if (sparkId) {
      if (!initialSparkDetails) {
        fetchSparkDetails(sparkId);
      }
    } else {
      setSparkDetails(null);
    }
  }, [sparkId, initialSparkDetails]);
  
  // Update details when initialSparkDetails changes
  useEffect(() => {
    if (initialSparkDetails) {
      setSparkDetails(initialSparkDetails);
    }
  }, [initialSparkDetails]);
  
  // Adjust position to stay in viewport
  useEffect(() => {
    const newPosition = adjustPanelPosition(position, panelMaxHeight);
    setAdjustedPosition(newPosition);
  }, [position, panelMaxHeight]);

  // Fetch spark details from the API
  const fetchSparkDetails = async (id: string) => {
    setLoading(true);
    try {
      const details = await getSparkDetails(id);
      setSparkDetails(details);
    } catch (error) {
      console.error("Error fetching spark details:", error);
      toast.error("Failed to load spark details");
    } finally {
      setLoading(false);
    }
  };

  // Handle mouse interactions
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Close panel when mouse leaves
    onClose();
  };

  // Handle tag operations
  const handleAddTag = async (newTag: string) => {
    if (!sparkId || !sparkDetails) return;
    
    try {
      // Create a resource object for the spark
      const sparkResource = createSparkResource(sparkId);
      
      // Create or reuse an existing tag
      const newTagObj = await tagService.createTag(newTag);
      
      // Associate the tag with the spark
      await tagService.addTagToResource(sparkResource, newTagObj.id);
      
      // Update local state to include the new tag
      setSparkDetails(prev => {
        if (!prev) return null;
        
        // Check if tag already exists to avoid duplicates
        const tagExists = prev.tags.some(tag => tag.name.toLowerCase() === newTag.toLowerCase());
        
        if (tagExists) {
          return prev;
        }
        
        return {
          ...prev,
          tags: [...prev.tags, { id: newTagObj.id, name: newTagObj.name }]
        };
      });
      
      toast.success("Tag added successfully");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
      throw error;
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!sparkId || !sparkDetails) return;
    
    try {
      // Create a resource object for the spark
      const sparkResource = createSparkResource(sparkId);
      
      // Remove the association between tag and spark
      await tagService.removeTagFromResource(sparkResource, tagId);
      
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
      throw error;
    }
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
            {/* Spark Content */}
            <SparkContent 
              sparkDetails={sparkDetails} 
              formatDate={formatDate} 
            />
            
            {/* Categories */}
            <SparkCategories 
              categories={sparkDetails.categories} 
            />
            
            {/* Tags */}
            <SparkTags 
              sparkId={sparkId}
              tags={sparkDetails.tags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </>
        )}
      </div>
    </div>
  );
} 