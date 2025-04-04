"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link" | "accent" | "branded";
  size?: "default" | "sm" | "md" | "lg" | "icon";
  className?: string;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className,
    variant = "primary",
    size = "default",
    children,
    ...props 
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variantStyles = {
      primary: "bg-spark-primary text-white hover:bg-spark-primary/90 dark:bg-spark-dark-primary dark:text-white dark:hover:bg-spark-dark-primary/90",
      secondary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 dark:bg-spark-dark-neutral/30 dark:text-neutral-50 dark:hover:bg-spark-dark-neutral/40",
      outline: "border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900 dark:border-spark-dark-neutral/30 dark:bg-transparent dark:hover:bg-spark-dark-neutral/20 dark:hover:text-neutral-50",
      destructive: "bg-red-500 text-neutral-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/90",
      ghost: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-spark-dark-neutral/20 dark:hover:text-neutral-50",
      link: "text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50",
      accent: "bg-spark-brand text-white hover:bg-spark-brand/90 dark:bg-spark-dark-brand dark:text-white dark:hover:bg-spark-dark-brand/90",
      branded: "bg-spark-secondary text-spark-base hover:bg-spark-secondary/90 dark:bg-spark-dark-secondary dark:text-white dark:hover:bg-spark-dark-secondary/90",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      md: "h-10 px-4 py-2",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size || "default"],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
