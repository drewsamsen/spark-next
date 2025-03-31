"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CheckCircle, XCircle } from "lucide-react";

export default function ReadwiseIntegration() {
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
              isConnected: false // Reset connection status when changing the key
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
      toast.error('Please enter an Access Token first');
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
        toast.success('Connection successful! Your Readwise Access Token is valid.');
        
        // Update the connection status in settings
        const updateResponse = await fetch('/api/user-settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            integrations: {
              readwise: {
                isConnected: true
              }
            }
          })
        });
        
        if (updateResponse.ok) {
          setIsConnected(true);
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Invalid Access Token" }));
        toast.error(`Connection failed: ${errorData.detail || 'Invalid Access Token'}`);
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Readwise Integration</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Connect your Readwise account to import your books, highlights and notes.
      </p>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="readwise-api-key" className="block text-sm font-medium">
            Readwise Access Token
          </label>
          
          <div className="flex flex-col gap-4">
            <input
              id="readwise-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-1/2 p-2 h-10 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your Readwise Access Token"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Get your Access Token from <a href="https://readwise.io/access_token" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Readwise API settings</a>
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={saveApiKey}
                disabled={isSaving}
                className="h-10 px-4 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Access Token'}
              </button>
              
              <button
                onClick={testConnection}
                disabled={isTesting || !apiKey}
                className="h-10 px-4 bg-green-500 text-white rounded text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isTesting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing...
                  </span>
                ) : 'Test Connection'}
              </button>
            </div>
          </div>
        </div>
        
        {apiKey && isConnected && (
          <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 w-full md:w-1/2">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Connection Status
              </h3>
              <div className="flex items-center mt-1">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Successfully connected to Readwise
                </p>
              </div>
            </div>
          </div>
        )}
        
        {apiKey && !isConnected && (
          <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 w-full md:w-1/2">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Connection Status
              </h3>
              <div className="flex items-center mt-1">
                <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Not connected to Readwise
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 