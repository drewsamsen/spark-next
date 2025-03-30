"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Login successful
      toast.success("Login successful!");
      
      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-spark-primary to-spark-brand dark:from-spark-dark-primary dark:to-spark-dark-brand">
            Welcome Back
          </span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <div className="bg-card dark:bg-spark-dark-surface rounded-2xl shadow-xl p-8 border border-border dark:border-spark-dark-neutral/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-border dark:border-spark-dark-neutral/30 px-4 py-3 text-foreground bg-background dark:bg-spark-dark-backdrop placeholder-muted-foreground shadow-sm focus:border-spark-primary dark:focus:border-spark-dark-primary focus:ring-spark-primary dark:focus:ring-spark-dark-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-border dark:border-spark-dark-neutral/30 px-4 py-3 text-foreground bg-background dark:bg-spark-dark-backdrop placeholder-muted-foreground shadow-sm focus:border-spark-primary dark:focus:border-spark-dark-primary focus:ring-spark-primary dark:focus:ring-spark-dark-primary"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-spark-primary to-spark-brand dark:from-spark-dark-primary dark:to-spark-dark-brand px-4 py-3 text-white shadow-lg transition-all hover:from-spark-primary/90 hover:to-spark-brand/90 dark:hover:from-spark-dark-primary/90 dark:hover:to-spark-dark-brand/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-spark-primary dark:focus:ring-spark-dark-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
} 