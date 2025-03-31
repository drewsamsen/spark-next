import React, { useState } from "react";
import { toast } from "react-toastify";
import { Play, Clock, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

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
    // More tasks will be added in the future
  ];
  
  // Run a task immediately
  const runTask = async (task: ScheduledTask) => {
    try {
      setIsRunning(prev => ({ ...prev, [task.id]: true }));
      
      // Get current user and session
      const supabase = getSupabaseBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();
      
      if (!sessionData.session || !userData.user) {
        toast.error("You must be logged in to run tasks");
        return;
      }
      
      const token = sessionData.session.access_token;
      const userId = userData.user.id;
      
      // For tasks requiring an API key, fetch it from user settings
      let apiKey;
      if (task.requiresApiKey && task.apiKeySource) {
        const settingsResponse = await fetch(`/api/user-settings?integration=${task.apiKeySource}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!settingsResponse.ok) {
          throw new Error(`Failed to get API key: ${settingsResponse.statusText}`);
        }
        
        const settings = await settingsResponse.json();
        apiKey = settings.integrations?.[task.apiKeySource]?.apiKey;
        
        if (!apiKey) {
          throw new Error(`No Access Token found for ${task.apiKeySource}. Please add it in your settings.`);
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
          ...(apiKey && { apiKey })
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