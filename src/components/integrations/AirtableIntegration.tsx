"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useIntegrationsService } from "@/hooks";
import { CheckCircle, XCircle } from "lucide-react";

export default function AirtableIntegration() {
  const [apiKey, setApiKey] = useState("");
  const [baseId, setBaseId] = useState("");
  const [tableId, setTableId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const integrationsService = useIntegrationsService();

  useEffect(() => {
    // On component mount, fetch the user's settings
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      console.log('Fetching Airtable settings...');
      const settings = await integrationsService.getAirtableSettings();
      
      // Apply settings if available
      if (settings) {
        setApiKey(settings.apiKey || '');
        setBaseId(settings.baseId || '');
        setTableId(settings.tableId || '');
        
        // Check if the connection is valid
        const isConfigValid = !!(settings.apiKey && settings.baseId && settings.tableId);
        setIsConnected(isConfigValid && await integrationsService.isAirtableConfigured());
        
        console.log('Airtable settings applied:', { 
          apiKey: !!settings.apiKey, 
          baseId: !!settings.baseId,
          tableId: !!settings.tableId,
          isConnected: isConfigValid
        });
      }
    } catch (error) {
      console.error('Error fetching Airtable settings:', error);
      toast.error(`Error loading settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      console.log('Saving Airtable settings:', {
        apiKey: !!apiKey,
        baseId,
        tableId,
      });
      
      const success = await integrationsService.updateAirtableSettings({
        apiKey,
        baseId,
        tableId
      });

      if (success) {
        toast.success('Airtable settings saved successfully');
        // Fetch the settings again to verify they were saved correctly
        await fetchUserSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving Airtable settings:', error);
      toast.error(`Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!apiKey) {
      toast.error('Please enter a Personal Access Token first');
      return;
    }

    if (!baseId) {
      toast.error('Please enter a Base ID');
      return;
    }

    if (!tableId) {
      toast.error('Please enter a Table ID');
      return;
    }

    setIsTesting(true);
    try {
      // Test the Airtable connection by making a request to the API
      const url = `https://api.airtable.com/v0/${baseId}/${tableId}?maxRecords=1`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Connection successful! Your Airtable settings are valid.');
        setIsConnected(true);
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: "Invalid Airtable settings" }}));
        toast.error(`Connection failed: ${errorData.error?.message || 'Invalid Airtable settings'}`);
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
      <h2 className="text-xl font-semibold mb-4">Airtable Integration</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Connect your Airtable to import data and create sparks with categories and tags. Airtable requires a Personal Access Token (API keys were deprecated in Feb 2024).
      </p>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="airtable-api-key" className="block text-sm font-medium mb-1">
              Airtable Personal Access Token
            </label>
            <input
              id="airtable-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full md:w-1/2 p-2 h-10 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your Airtable Personal Access Token"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Create a token from <a href="https://airtable.com/create/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Airtable Developer Hub</a>. Choose the <code>data.records:read</code> and <code>data.records:write</code> scopes, and select your base.
            </p>
          </div>
          
          <div>
            <label htmlFor="airtable-base-id" className="block text-sm font-medium mb-1">
              Base ID
            </label>
            <input
              id="airtable-base-id"
              type="text"
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full md:w-1/2 p-2 h-10 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your Airtable Base ID"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Find your Base ID in the API documentation of your base or in the URL: airtable.com/{'{base_id}'}
            </p>
          </div>
          
          <div>
            <label htmlFor="airtable-table-id" className="block text-sm font-medium mb-1">
              Table ID/Name
            </label>
            <input
              id="airtable-table-id"
              type="text"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="w-full md:w-1/2 p-2 h-10 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your Airtable Table ID or name"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This can be the table name or ID from your Airtable base. Spaces should be replaced with %20 in the ID.
            </p>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="h-10 px-4 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            
            <button
              onClick={testConnection}
              disabled={isTesting || !apiKey || !baseId || !tableId}
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
        
        {apiKey && baseId && tableId && isConnected && (
          <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 w-full md:w-1/2">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Connection Status
              </h3>
              <div className="flex items-center mt-1">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Successfully connected to Airtable
                </p>
              </div>
            </div>
          </div>
        )}
        
        {(apiKey || baseId || tableId) && !isConnected && (
          <div className="p-4 border rounded-md border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 w-full md:w-1/2">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Connection Status
              </h3>
              <div className="flex items-center mt-1">
                <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Not connected to Airtable
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 