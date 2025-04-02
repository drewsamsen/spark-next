"use client";

import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SparkDomain } from "@/lib/types";

interface SparkCategoriesProps {
  categories: SparkDomain['categories'];
}

/**
 * Component for displaying the categories of a spark
 */
export function SparkCategories({ categories }: SparkCategoriesProps) {
  if (categories.length === 0) return null;
  
  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5" />
        Categories
      </h4>
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
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
  );
} 