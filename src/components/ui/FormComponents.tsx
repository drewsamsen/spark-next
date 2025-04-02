"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-600",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {helpText && !error && <p className="text-sm text-neutral-500 dark:text-neutral-400">{helpText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helpText, options, id, ...props }, ref) => {
    const selectId = id || React.useId();
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-600",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {helpText && !error && <p className="text-sm text-neutral-500 dark:text-neutral-400">{helpText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

// Checkbox Component
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const checkboxId = id || React.useId();
    
    return (
      <div className="flex items-start space-x-2">
        <div className="flex h-5 items-center">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            className={cn(
              "h-4 w-4 rounded border border-neutral-300 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-600",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
        </div>
        <div className="flex flex-col">
          {label && (
            <label htmlFor={checkboxId} className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {label}
            </label>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {helpText && !error && <p className="text-sm text-neutral-500 dark:text-neutral-400">{helpText}</p>}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const textareaId = id || React.useId();
    
    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:ring-neutral-600",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {helpText && !error && <p className="text-sm text-neutral-500 dark:text-neutral-400">{helpText}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// FormGroup Component
export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className, ...props }: FormGroupProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  );
}

// FormActions Component
export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className, ...props }: FormActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 pt-4", className)} {...props}>
      {children}
    </div>
  );
} 