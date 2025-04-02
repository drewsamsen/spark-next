"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuthService } from "@/hooks";
import { RefreshCw, Info } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [envInfo, setEnvInfo] = useState<string | null>(null);

  const router = useRouter();
  const authService = useAuthService();

  // Check environment on mount
  useEffect(() => {
    // Only run in development environment
    if (process.env.NODE_ENV === 'development') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const isProdDb = process.env.NEXT_PUBLIC_USING_PROD_DB;
      
      setEnvInfo(`
        URL: ${supabaseUrl ? supabaseUrl : 'NOT SET'}
        KEY: ${supabaseKey ? '[SET]' : 'NOT SET'}
        PROD DB: ${isProdDb ? 'YES' : 'NO'}
      `);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Don't sign out first - that's likely causing session issues
      
      // Attempt to sign in
      const authResult = await authService.signInWithPassword(email, password);
      
      if (!authResult) {
        setErrorMessage("Authentication failed. Please check your credentials and try again.");
        throw new Error("Authentication failed");
      }
      
      // Login successful
      toast.success("Login successful!");
      
      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      if (!errorMessage) {
        // Only show toast if we haven't set a specific error message
        toast.error(error instanceof Error ? error.message : "Failed to login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAuthState = async () => {
    setIsResetting(true);
    try {
      // Use the service to reset client
      await authService.resetClient();
      toast.success("Auth state reset successfully. Try logging in again.");
      setErrorMessage(null);
    } catch (error) {
      console.error("Error resetting auth state:", error);
      toast.error("Error resetting auth state");
    } finally {
      setIsResetting(false);
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

          {errorMessage && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-spark-primary to-spark-brand dark:from-spark-dark-primary dark:to-spark-dark-brand px-4 py-3 text-white shadow-lg transition-all hover:from-spark-primary/90 hover:to-spark-brand/90 dark:hover:from-spark-dark-primary/90 dark:hover:to-spark-dark-brand/90 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-spark-primary dark:focus:ring-spark-dark-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
      
      {process.env.NODE_ENV === 'development' && envInfo && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800/40">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-yellow-700 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">Environment Information</p>
              <pre className="text-xs text-yellow-700 dark:text-yellow-400 mt-1 whitespace-pre-wrap">
                {envInfo}
              </pre>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        <button
          onClick={handleResetAuthState}
          disabled={isResetting}
          className="text-gray-500 hover:text-spark-primary dark:text-gray-400 dark:hover:text-spark-dark-primary inline-flex items-center text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          {isResetting ? "Resetting..." : "Reset authentication state"}
        </button>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Troubleshooting tool - clears local auth data
        </div>
      </div>
    </div>
  );
} 