"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthService } from "@/hooks";

interface AuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthCheck({ children, redirectTo = "/login" }: AuthCheckProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const authService = useAuthService();
  
  // Skip auth check on login page
  const isLoginPage = pathname === '/login';
  
  useEffect(() => {
    // Don't perform auth check on login page
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }
    
    const checkAuth = async () => {
      try {
        const session = await authService.getSession();
        
        if (!session) {
          // No session, redirect to login
          router.push(redirectTo);
          return;
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Set up interval to check for session changes
    const interval = setInterval(async () => {
      try {
        const session = await authService.getSession();
        if (!session && isAuthenticated) {
          setIsAuthenticated(false);
          router.push(redirectTo);
        } else if (session && !isAuthenticated) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error in periodic auth check:", error);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [redirectTo, router, authService, isLoginPage, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spark-primary dark:border-spark-dark-primary"></div>
      </div>
    );
  }

  // Return children directly on login page, otherwise only when authenticated
  return isLoginPage || isAuthenticated ? <>{children}</> : null;
} 