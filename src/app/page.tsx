"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks";
import { MainContent } from "@/components/Layout";

export default function HomePage() {
  const router = useRouter();
  const { session, loading } = useAuthSession();
  const [redirected, setRedirected] = useState(false);

  // Only redirect if not loading and not already redirected
  useEffect(() => {
    if (!loading && !session && !redirected) {
      setRedirected(true);
      router.push("/login");
    }
  }, [session, router, loading, redirected]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spark-primary dark:border-spark-dark-primary"></div>
      </div>
    );
  }

  // If user is logged in, show the main content
  return session ? <MainContent /> : null;
}
