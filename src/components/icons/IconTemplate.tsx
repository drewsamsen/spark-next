import React from 'react';

/**
 * Base interface for icon props
 * Extends SVG props to allow for all standard SVG attributes
 */
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

/**
 * Template for creating new icon components
 * 
 * Usage:
 * 1. Duplicate this file with a descriptive name (e.g., UserIcon.tsx)
 * 2. Replace SVG path data with your icon's path
 * 3. Export from icons/index.ts
 * 
 * Example:
 * <MyIcon size={24} className="text-blue-500" />
 */
export function IconTemplate({ 
  size = 24, 
  strokeWidth = 2,
  className = "", 
  ...props 
}: IconProps) {
  return (
    <svg 
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Replace with your icon's SVG path data */}
      <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" />
    </svg>
  );
} 