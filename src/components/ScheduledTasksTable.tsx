import React, { useState } from "react";
import { toast } from "react-toastify";
import { Play, Clock, Loader2 } from "lucide-react";
import { useAuthService, useIntegrationsService } from "@/hooks";

// Define task types
interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  // Schedule options in the future will go here
  isSchedulable: boolean;
  triggerEndpoint: string;
  requiresApiKey?: boolean;
  apiKeySource?: string;
}

export default function ScheduledTasksTable() {
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});
  const authService = useAuthService();
  const integrationsService = useIntegrationsService();
  
  // Define available tasks
  const availableTasks: ScheduledTask[] = [
    {
      id: "readwise-books-count",
      name: "Count Readwise Books",
      description: "Count the number of books in your Readwise account",
      isSchedulable: false, // Not schedulable yet
      triggerEndpoint: "/api/inngest/trigger-readwise",
      requiresApiKey: true,
      apiKeySource: "readwise"
    },
    {
      id: "readwise-books-import",
      name: "Import Readwise Books",
      description: "Import all your books from Readwise into the database",
      isSchedulable: false,
      triggerEndpoint: "/api/inngest/trigger-sync-books",
      requiresApiKey: true,
      apiKeySource: "readwise"
    },
    {
      id: "readwise-highlights-sync",
      name: "Sync Readwise Highlights",
      description: "Import highlights from your Readwise books into the database",
      isSchedulable: false,
      triggerEndpoint: "/api/inngest/trigger-sync-highlights",
      requiresApiKey: true,
      apiKeySource: "readwise"
    },
    {
      id: "migrate-highlight-tags",
      name: "Migrate Highlight Tags",
      description: "Convert legacy rw_tags from highlights to proper tags using the categorization system",
      isSchedulable: false,
      triggerEndpoint: "/api/inngest/trigger-migrate-tags",
      requiresApiKey: false
    },
    {
      id: "airtable-import",
      name: "Import from Airtable",
      description: "Import data from an Airtable table and create sparks with associated categories and tags",
      isSchedulable: false,
      triggerEndpoint: "/api/inngest/trigger-airtable-import",
      requiresApiKey: true,
      apiKeySource: "airtable"
    },
    // More tasks will be added in the future
  ];
  
  // Run a task immediately
  const runTask = async (task: ScheduledTask) => {
    try {
      setIsRunning(prev => ({ ...prev, [task.id]: true }));
      
      // Get current user and session using auth service
      const session = await authService.getSession();
      
      if (!session || !session.user) {
        toast.error("You must be logged in to run tasks");
        return;
      }
      
      const token = session.token;
      const userId = session.user.id;
      
      // For tasks requiring an API key, fetch it from integrations service
      let apiKey, baseId, tableId;
      if (task.requiresApiKey && task.apiKeySource) {
        try {
          if (task.apiKeySource === 'readwise') {
            const settings = await integrationsService.getReadwiseSettings();
            apiKey = settings?.accessToken;
          } else if (task.apiKeySource === 'airtable') {
            const settings = await integrationsService.getAirtableSettings();
            apiKey = settings?.apiKey;
            baseId = settings?.baseId;
            tableId = settings?.tableId;
            
            if (!baseId || !tableId) {
              throw new Error(`Missing Airtable Base ID or Table ID. Please configure these in your settings.`);
            }
          }
          
          if (!apiKey) {
            throw new Error(`No Access Token found for ${task.apiKeySource}. Please add it in your settings.`);
          }
        } catch (error) {
          throw new Error(`Failed to get API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Trigger the task
      const response = await fetch(task.triggerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          ...(apiKey && { apiKey }),
          ...(baseId && { baseId }),
          ...(tableId && { tableId })
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to run ${task.name}`);
      }
      
      toast.success(`${task.name} started successfully`);
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(prev => ({ ...prev, [task.id]: false }));
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Task
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Schedule
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {availableTasks.length > 0 ? (
              availableTasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {task.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {task.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {task.isSchedulable ? (
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Configure
                      </button>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">
                        Not schedulable
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => runTask(task)}
                      disabled={isRunning[task.id]}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRunning[task.id] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Run Now
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No tasks available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 