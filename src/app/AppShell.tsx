'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from './dashboard-layout';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  // Skip the dashboard layout for specific pages like login
  if (pathname === '/login') {
    return <>{children}</>;
  }
  
  // For all other pages, use the dashboard layout
  return <DashboardLayout>{children}</DashboardLayout>;
} 