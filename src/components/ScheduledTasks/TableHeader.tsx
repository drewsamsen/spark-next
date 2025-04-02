"use client";

/**
 * Component for the scheduled tasks table header
 */
export function TableHeader() {
  return (
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
  );
} 