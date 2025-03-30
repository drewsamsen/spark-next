"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      
      // Check if the user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is already logged in, redirect to dashboard
        router.push("/dashboard");
      }
      
      setIsLoading(false);
    };
    
    checkSession();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 px-4">
      <div className="absolute top-0 w-full p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Spark
          </Link>
        </div>
      </div>

      <LoginForm />
      
      <div className="mt-8 text-center text-sm text-neutral-600 dark:text-neutral-400">
        <p>
          Don't have an account?{" "}
          <button 
            onClick={() => alert("Registration not implemented yet")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sign up
          </button>
        </p>
        <p className="mt-2">
          Use test@example.com / password123 to log in
        </p>
      </div>
      
      <ToastContainer position="top-right" theme="colored" />
    </div>
  );
} 