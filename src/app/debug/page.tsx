'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserSettings, useAuthService } from '@/hooks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserSettings } from '@/lib/types';
import { toast } from 'react-toastify';

export default function DebugPage() {
  const { settings, isLoading } = useUserSettings();
  const authService = useAuthService();
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [shouldThrowError, setShouldThrowError] = useState(false);
  const [cronTriggerLoading, setCronTriggerLoading] = useState(false);
  const [cronTriggerMessage, setCronTriggerMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  const triggerScheduledTasksCron = async () => {
    setCronTriggerLoading(true);
    setCronTriggerMessage(null);

    try {
      // Get current session for auth token
      const session = await authService.getSession();
      
      if (!session || !session.token) {
        toast.error("You must be logged in to trigger scheduled tasks");
        setCronTriggerMessage({ 
          type: 'error', 
          text: 'Authentication required. Please log in.' 
        });
        return;
      }

      const response = await fetch('/api/inngest/trigger-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCronTriggerMessage({ 
          type: 'success', 
          text: data.message || 'Scheduled tasks cron triggered successfully!' 
        });
        toast.success('Scheduled tasks cron triggered successfully!');
      } else {
        setCronTriggerMessage({ 
          type: 'error', 
          text: data.error || 'Failed to trigger scheduled tasks cron' 
        });
        toast.error(data.error || 'Failed to trigger scheduled tasks cron');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to trigger scheduled tasks cron';
      setCronTriggerMessage({ 
        type: 'error', 
        text: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setCronTriggerLoading(false);
    }
  };

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
          <Button
            onClick={() => setShouldThrowError(true)}
            variant="destructive"
          >
            Throw Test Error
          </Button>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Click this button to trigger an error and see the error boundary in action.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inngest Triggers</CardTitle>
          <CardDescription>
            Manually trigger Inngest cron jobs and functions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button
              onClick={triggerScheduledTasksCron}
              disabled={cronTriggerLoading}
              variant="primary"
            >
              {cronTriggerLoading ? 'Triggering...' : 'Trigger Scheduled Tasks Cron'}
            </Button>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Manually trigger the scheduled-tasks-cron function to process all user scheduled tasks.
            </p>
            {cronTriggerMessage && (
              <div className={`mt-3 p-3 rounded ${
                cronTriggerMessage.type === 'success' 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {cronTriggerMessage.text}
              </div>
            )}
          </div>
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