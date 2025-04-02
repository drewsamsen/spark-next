"use client";

/**
 * Component for the empty state when no tasks are available
 */
export function EmptyState() {
  return (
    <tr>
      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        No tasks available
      </td>
    </tr>
  );
} 