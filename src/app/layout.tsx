import React from "react";
import "@/app/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { Metadata } from "next";
import { ClientProvider } from "@/components/Providers";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeAwareToast } from "@/components/theme/ThemeAwareToast";
import { UISettingsProvider } from '@/contexts/ui-settings-context';
import { AuthCheck } from "@/components/auth/AuthCheck";
import AppShell from './AppShell';

export const metadata: Metadata = {
  title: 'Spark | Your Knowledge Hub',
  description: 'Organize your knowledge and spark new insights',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="light" enableSystem={false}>
          <ClientProvider>
            <UISettingsProvider>
              <AuthCheck>
                <AppShell>{children}</AppShell>
              </AuthCheck>
            </UISettingsProvider>
            <ThemeAwareToast />
          </ClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
