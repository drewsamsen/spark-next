"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "react-toastify";
import { useAuthService } from "@/hooks";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const authService = useAuthService();

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      const success = await authService.signOut();
      
      if (!success) {
        throw new Error("Failed to sign out");
      }
      
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to log out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      <LogOut className="h-4 w-4" />
      <span>{isLoading ? "Logging out..." : "Logout"}</span>
    </button>
  );
} 