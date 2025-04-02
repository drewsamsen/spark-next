"use client";

import { Clock, Loader2, Play } from "lucide-react";
import { ScheduledTask } from "./types";

interface TaskRowProps {
  task: ScheduledTask;
  isRunning: boolean;
  onRunTask: (task: ScheduledTask) => Promise<void>;
}

/**
 * Component for a single task row in the table
 */
export function TaskRow({ task, isRunning, onRunTask }: TaskRowProps) {
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