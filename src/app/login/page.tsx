"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services";
import Link from "next/link";
import { LogoIcon } from "@/components/icons/LogoIcon";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      // Check if the user is already logged in
      const session = await authService.getSession();
      
      if (session) {
        // User is already logged in, redirect to dashboard
        router.push("/dashboard");
      }
      
      setIsLoading(false);
    };
    
    checkSession();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spark-primary dark:border-spark-dark-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-background/95 dark:from-spark-dark-backdrop dark:to-spark-dark-backdrop/95 px-4">
      <div className="absolute top-0 w-full p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
            <LogoIcon className="h-8 w-8 text-spark-brand dark:text-spark-dark-brand" />
            <span className="text-spark-primary dark:text-spark-dark-primary">Spark</span>
          </Link>
        </div>
      </div>

      <LoginForm />
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Don't have an account?{" "}
          <button 
            onClick={() => alert("Registration not implemented yet")}
            className="text-spark-primary dark:text-spark-dark-primary hover:underline"
          >
            Sign up
          </button>
        </p>
        <p className="mt-2">
          Use test@example.com / password123 to log in
        </p>
      </div>
    </div>
  );
} 