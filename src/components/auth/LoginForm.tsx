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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600">
            Welcome Back
          </span>
        </h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          Sign in to your account
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-800/50 rounded-2xl shadow-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
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
              className="mt-2 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 shadow-sm dark:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
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
              className="mt-2 block w-full rounded-lg border border-neutral-300 dark:border-neutral-600 px-4 py-3 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 shadow-sm dark:bg-neutral-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
} 