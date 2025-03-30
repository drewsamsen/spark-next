import React from "react";
import "@/app/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { Metadata } from "next";
import ClientProvider from "@/components/ClientProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeAwareToast } from "@/components/theme/ThemeAwareToast";
import { UISettingsProvider } from '@/contexts/ui-settings-context';
import { ToastContainer } from "react-toastify";
import { AuthCheck } from "@/components/auth/AuthCheck";
import AppShell from './AppShell';

export const metadata: Metadata = {
  title: "Spark - Knowledge Management",
  description: "Your intelligent workspace for personal knowledge management",
  icons: {
    icon: "/favicon.ico",
  },
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
                <ToastContainer position="top-right" theme="colored" />
              </AuthCheck>
            </UISettingsProvider>
            <ThemeAwareToast />
          </ClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
