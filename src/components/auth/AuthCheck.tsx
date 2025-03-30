"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface AuthCheckProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthCheck({ children, redirectTo = "/login" }: AuthCheckProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();
  
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
        const { data: { session } } = await supabase.auth.getSession();
        
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
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          router.push(redirectTo);
        } else if (event === 'SIGNED_IN' && session) {
          setIsAuthenticated(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [redirectTo, router, supabase, isLoginPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Return children directly on login page, otherwise only when authenticated
  return isLoginPage || isAuthenticated ? <>{children}</> : null;
} 