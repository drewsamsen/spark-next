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

// Import FunctionLogsTable with dynamic loading as well
const FunctionLogsTable = dynamic(() => import('@/components/FunctionLogsTable'), {
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
  const [activeTab, setActiveTab] = useState("general");

  // Tab navigation
  const tabs = [
    { id: "general", label: "General" },
    { id: "background-jobs", label: "Background Jobs" },
    { id: "appearance", label: "Appearance" },
    { id: "notifications", label: "Notifications" },
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
      
      {/* General Settings */}
      {activeTab === "general" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          <p className="text-gray-500">Configure your general application settings.</p>
        </div>
      )}
      
      {/* Background Jobs */}
      {activeTab === "background-jobs" && (
        <div>
          <ReadwiseIntegration />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Scheduled Tasks</h2>
            <p className="text-gray-500">
              View and manage your scheduled background tasks.
            </p>
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-500">No scheduled tasks configured yet.</p>
            </div>
          </div>
          
          {/* Function Logs Table */}
          <div className="mb-6">
            <FunctionLogsTable />
          </div>
        </div>
      )}
      
      {/* Appearance Settings */}
      {activeTab === "appearance" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <p className="text-gray-500">Customize the appearance of your application.</p>
        </div>
      )}
      
      {/* Notification Settings */}
      {activeTab === "notifications" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <p className="text-gray-500">Configure your notification preferences.</p>
        </div>
      )}
    </div>
  );
} 