/**
 * Adjusts the position of the spark preview panel to ensure it stays within viewport
 */
export function adjustPanelPosition(
  position: { top: number; right: number },
  panelMaxHeight: number
): { top: number; right: number } {
  // Default to the provided position
  const newPosition = {...position};
  
  // Make sure the panel doesn't go below the viewport
  const windowHeight = window.innerHeight;
  const bottomEdge = position.top + panelMaxHeight;
  
  if (bottomEdge > windowHeight) {
    // Move the panel up to fit in the viewport
    newPosition.top = Math.max(0, windowHeight - panelMaxHeight);
  }
  
  return newPosition;
}

/**
 * Format date using standardized formatting
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
} 