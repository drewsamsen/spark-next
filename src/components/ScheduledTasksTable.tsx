"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useAuthService, useIntegrationsService } from "@/hooks";
import {
  TaskRow,
  TableHeader,
  EmptyState,
  TaskService,
  availableTasks,
  ScheduledTask,
  TaskRunningState
} from "./ScheduledTasks";

/**
 * Component for displaying a table of scheduled tasks that can be run manually
 */
export default function ScheduledTasksTable() {
  const [isRunning, setIsRunning] = useState<TaskRunningState>({});
  const authService = useAuthService();
  const integrationsService = useIntegrationsService();
  
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
      
      // Get API key function
      const getApiKey = async (source: string) => {
        if (source === 'readwise') {
          const settings = await integrationsService.getReadwiseSettings();
          return { apiKey: settings?.accessToken || undefined };
        } else if (source === 'airtable') {
          const settings = await integrationsService.getAirtableSettings();
          return { 
            apiKey: settings?.apiKey || undefined,
            baseId: settings?.baseId || undefined,
            tableId: settings?.tableId || undefined
          };
        }
        return {};
      };
      
      // Run the task
      await TaskService.runTask(task, userId, token, getApiKey);
      
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
          <TableHeader />
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {availableTasks.length > 0 ? (
              availableTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isRunning={!!isRunning[task.id]}
                  onRunTask={runTask}
                />
              ))
            ) : (
              <EmptyState />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 