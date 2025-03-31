"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ReadwiseIntegration() {
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [bookCount, setBookCount] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setToken(data.session.access_token);
      }
    };
    
    checkSession();
  }, []);

  useEffect(() => {
    // On component mount, fetch the user's settings
    fetchUserSettings();
  }, [token]);

  const fetchUserSettings = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/user-settings?integration=readwise', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If the response is 404, it means the user doesn't have settings yet
      if (response.status === 404) {
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data && data.integrations && data.integrations.readwise) {
        const readwiseSettings = data.integrations.readwise;
        setApiKey(readwiseSettings.apiKey || '');
        setIsConnected(readwiseSettings.isConnected || false);
        setBookCount(readwiseSettings.bookCount || 0);
      }
    } catch (error) {
      // Only show toast for network or server errors, not for expected missing settings
      if (error instanceof Error && !error.message.includes('Failed to fetch settings')) {
        toast.error(`Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const saveApiKey = async () => {
    if (!token) {
      toast.error("You must be logged in to save settings");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          integrations: {
            readwise: {
              apiKey,
              isConnected: false, // Reset connection status when changing the key
              bookCount: 0
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save API key: ${response.statusText}`);
      }

      toast.success('API key saved successfully');
    } catch (error) {
      toast.error(`Error saving API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!token) {
      toast.error("You must be logged in to test connection");
      return;
    }
    
    if (!apiKey) {
      toast.error('Please enter an API key first');
      return;
    }

    setIsTesting(true);
    try {
      // Directly test the Readwise API key by calling their auth endpoint
      const response = await fetch('https://readwise.io/api/v2/auth/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`
        }
      });
      
      if (response.status === 204) {
        toast.success('Connection successful! Your Readwise API key is valid.');
        setIsConnected(true);
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Invalid API key" }));
        toast.error(`Connection failed: ${errorData.detail || 'Invalid API key'}`);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error(`Error testing connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnected(false);
    } finally {
      setIsTesting(false);
    }
  };

  // Function to trigger the Readwise book count
  const syncReadwiseBooks = async () => {
    if (!token || !apiKey) return;
    
    try {
      setIsPolling(true);
      
      // Get current user ID
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("Failed to get user info");
      }
      
      // Call our server endpoint to trigger the book count
      const response = await fetch('/api/inngest/trigger-readwise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userData.user.id,
          apiKey: apiKey
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trigger Readwise book count");
      }
      
      toast.success("Book count started! Results will be updated shortly.");
      
      // Start polling for updates
      startPollingForUpdates();
    } catch (error) {
      toast.error(`Error starting book count: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsPolling(false);
    }
  };

  const startPollingForUpdates = () => {
    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 20; // Maximum polling attempts
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        setIsPolling(false);
        return;
      }
      
      try {
        // Re-fetch the session to ensure we have a fresh token
        const supabase = getSupabaseBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const currentToken = sessionData.session?.access_token;
        
        if (!currentToken) {
          toast.error("Session expired. Please refresh the page.");
          clearInterval(pollInterval);
          setIsPolling(false);
          return;
        }
        
        const response = await fetch('/api/user-settings?integration=readwise', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to poll for updates: ${response.statusText}`);
        }
        
        const settingsData = await response.json();
        
        if (settingsData && settingsData.integrations && settingsData.integrations.readwise) {
          const readwiseSettings = settingsData.integrations.readwise;
          setApiKey(readwiseSettings.apiKey || '');
          setIsConnected(readwiseSettings.isConnected || false);
          
          // If book count has been updated and is greater than 0, we've got data!
          if (readwiseSettings.bookCount > 0) {
            setBookCount(readwiseSettings.bookCount);
            toast.success(`Sync complete! Found ${readwiseSettings.bookCount} books.`);
            clearInterval(pollInterval);
            setIsPolling(false);
          }
        }
      } catch (error) {
        console.error('Error polling for updates:', error);
        // Don't show an error toast here, just log to console
      }
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  };

  const syncBooks = async () => {
    if (!token) {
      toast.error("You must be logged in to count books");
      return;
    }
    
    if (!apiKey) {
      toast.error('Please enter and save your API key first');
      return;
    }
    
    setIsPolling(true);
    try {
      // Get current user ID
      const supabase = getSupabaseBrowserClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("Failed to get user info");
      }
      
      // Call our API endpoint that will trigger Inngest
      const response = await fetch("/api/inngest/trigger-readwise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userData.user.id,
          apiKey: apiKey
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trigger book count");
      }
      
      toast.success("Started counting your Readwise books!");
      
      // Poll for updates
      startPollingForUpdates();
    } catch (error) {
      console.error('Error syncing books:', error);
      toast.error(`Error counting books: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsPolling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Readwise Integration</h2>
      <p className="text-gray-500 mb-4">
        Connect your Readwise account to import your books, highlights and notes.
      </p>
      
      <div className="mb-4">
        <label htmlFor="readwise-api-key" className="block text-sm font-medium mb-2">
          Readwise API Key
        </label>
        <input
          id="readwise-api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your Readwise API key"
        />
        <p className="text-sm text-gray-500 mt-1">
          Get your API key from <a href="https://readwise.io/access_token" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Readwise API settings</a>
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={saveApiKey}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Save API Key
        </button>
        
        <button
          onClick={testConnection}
          disabled={isTesting || !apiKey}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Test Connection
        </button>
        
        {isConnected && (
          <button
            onClick={syncBooks}
            disabled={isPolling}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Sync Book Count
          </button>
        )}
      </div>
    </div>
  );
} 