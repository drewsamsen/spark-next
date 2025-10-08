"use client";

import { useState, useEffect } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "react-toastify";
import { ScheduledTask, TaskScheduleConfig } from "./types";
import { updateTaskSchedule, getTaskSchedule } from "@/lib/user-settings-service";
import { useAuthService } from "@/hooks";

interface TaskRowProps {
  task: ScheduledTask;
  isRunning: boolean;
  onRunTask: (task: ScheduledTask) => Promise<void>;
}

/**
 * Component for a single task row in the table
 */
export function TaskRow({ task, isRunning, onRunTask }: TaskRowProps) {
  const [schedule, setSchedule] = useState<'off' | 'hourly' | 'daily' | 'weekly' | 'monthly'>('off');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const authService = useAuthService();
  
  // Load the current schedule for this task
  useEffect(() => {
    async function loadSchedule() {
      try {
        const session = await authService.getSession();
        if (!session?.user?.id) return;
        
        const taskSchedule = await getTaskSchedule(session.user.id, task.id);
        if (taskSchedule) {
          setSchedule(taskSchedule.frequency);
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSchedule();
  }, [task.id, authService]);
  
  // Handle schedule change
  const handleScheduleChange = async (newFrequency: 'off' | 'hourly' | 'daily' | 'weekly' | 'monthly') => {
    try {
      setIsSaving(true);
      const session = await authService.getSession();
      if (!session?.user?.id) {
        toast.error("You must be logged in to configure schedules");
        return;
      }
      
      const enabled = newFrequency !== 'off';
      const result = await updateTaskSchedule(session.user.id, task.id, {
        enabled,
        frequency: newFrequency
      });
      
      if (result.success) {
        setSchedule(newFrequency);
        toast.success(`Schedule updated: ${newFrequency === 'off' ? 'Disabled' : newFrequency}`);
      } else {
        toast.error(`Failed to update schedule: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {task.name}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        {task.description}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {task.isSchedulable ? (
          <select
            value={schedule}
            onChange={(e) => handleScheduleChange(e.target.value as 'off' | 'hourly' | 'daily' | 'weekly' | 'monthly')}
            disabled={isSaving || isLoading}
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="off">Off</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic">
            Not schedulable
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onRunTask(task)}
          disabled={isRunning}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
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
  );
} 