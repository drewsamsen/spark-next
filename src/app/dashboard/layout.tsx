'use client';

import { UISettingsProvider } from '@/contexts/ui-settings-context';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UISettingsProvider>
      {/* The UISettingsProvider will not render children until settings are loaded */}
      <div className="h-screen flex flex-col">
        {children}
        <ToastContainer position="top-right" theme="colored" />
      </div>
    </UISettingsProvider>
  );
} 