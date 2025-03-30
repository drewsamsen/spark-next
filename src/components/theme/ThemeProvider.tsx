"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  forcedTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = "system",
  ...props 
}: ThemeProviderProps) {
  // Use theme from server (middleware) as default if available
  const [theme, setTheme] = useState<string | undefined>(defaultTheme);

  // Once client-side, check for theme in response headers
  useEffect(() => {
    const getThemeFromHeader = () => {
      try {
        // Instead of extracting from cookies, get the response header directly
        // This can be set through the middleware
        const headerTheme = document.cookie
          .split('; ')
          .find(row => row.startsWith('theme='))
          ?.split('=')[1];
          
        if (headerTheme) {
          setTheme(headerTheme);
        }
      } catch (error) {
        console.error('Error getting theme from header:', error);
      }
    };
    
    getThemeFromHeader();
  }, []);

  return (
    <NextThemeProvider 
      {...props} 
      defaultTheme={theme} 
      attribute="class"
    >
      {children}
    </NextThemeProvider>
  );
}
