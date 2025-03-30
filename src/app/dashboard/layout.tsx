'use client';

import { UISettingsProvider } from '@/contexts/ui-settings-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UISettingsProvider>
      <div className="h-screen flex flex-col">
        {children}
      </div>
    </UISettingsProvider>
  );
} 