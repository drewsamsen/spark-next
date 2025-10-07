'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserSettings } from '@/hooks/use-user-settings';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserSettings } from '@/lib/types';

export default function DebugPage() {
  const { settings, isLoading } = useUserSettings();
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [shouldThrowError, setShouldThrowError] = useState(false);

  // Test error boundary
  if (shouldThrowError) {
    throw new Error('This is a test error to verify the error boundary works correctly!');
  }

  useEffect(() => {
    // Collect all localStorage data
    const data: Record<string, any> = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            data[key] = value ? JSON.parse(value) : null;
          } catch (e) {
            // If value can't be parsed as JSON, store as string
            data[key] = localStorage.getItem(key);
          }
        }
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
    
    setLocalStorageData(data);
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Debug Information</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Error Boundary Test</CardTitle>
          <CardDescription>
            Test the error boundary implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => setShouldThrowError(true)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Throw Test Error
          </button>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Click this button to trigger an error and see the error boundary in action.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
          <CardDescription>
            Current user settings from the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <pre className="text-sm overflow-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local Storage</CardTitle>
          <CardDescription>
            All data currently stored in localStorage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <pre className="text-sm overflow-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 