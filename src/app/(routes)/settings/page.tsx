"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

// We'll use a dynamic import for Inngest to prevent node: protocol import errors
import dynamic from 'next/dynamic';

// Create a component that dynamically imports the Inngest client
const ReadwiseIntegration = dynamic(() => import('@/components/integrations/ReadwiseIntegration'), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <div className="animate-pulse h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  ),
});

// Import the AirtableIntegration component
const AirtableIntegration = dynamic(() => import('@/components/integrations/AirtableIntegration'), {
  ssr: false,
  loading: () => (
    <div className="p-4">
      <div className="animate-pulse h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="animate-pulse h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  ),
});

// Import ScheduledTasksTable with dynamic loading
const ScheduledTasksTable = dynamic(() => import('@/components/ScheduledTasks').then(mod => ({ default: mod.ScheduledTasksTable })), {
  ssr: false,
  loading: () => (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="animate-pulse h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="animate-pulse h-48 bg-gray-100 dark:bg-gray-900 rounded-lg"></div>
    </div>
  ),
});

// Import FunctionLogsTable with dynamic loading as well
const FunctionLogsTable = dynamic(() => import('@/components/FunctionLogs').then(mod => ({ default: mod.FunctionLogsTable })), {
  ssr: false,
  loading: () => (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="animate-pulse h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="animate-pulse h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  ),
});

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("integrations");

  // Tab navigation - changed to just two tabs
  const tabs = [
    { id: "integrations", label: "Integrations" },
    { id: "background-jobs", label: "Automations" },
  ];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Settings tabs */}
      <div className="flex border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <div>
          <ReadwiseIntegration />
          <AirtableIntegration />
        </div>
      )}
      
      {/* Automations */}
      {activeTab === "background-jobs" && (
        <div>          
          {/* Scheduled Tasks Table */}
          <div id="scheduled-tasks-section" className="mb-6">
            <ScheduledTasksTable />
          </div>
          
          {/* Function Logs Table */}
          <div id="function-logs-section" className="mb-6">
            <FunctionLogsTable />
          </div>
        </div>
      )}
    </div>
  );
} 