import { toast } from "react-toastify";
import { ScheduledTask } from "./types";

/**
 * Service for running scheduled tasks
 */
export class TaskService {
  /**
   * Run a task immediately
   */
  static async runTask(
    task: ScheduledTask, 
    userId: string, 
    token: string,
    getApiKey: (source: string) => Promise<{ apiKey?: string; baseId?: string; tableId?: string }>
  ): Promise<void> {
    // For tasks requiring an API key, fetch it
    let apiKey, baseId, tableId;
    if (task.requiresApiKey && task.apiKeySource) {
      try {
        const result = await getApiKey(task.apiKeySource);
        apiKey = result.apiKey;
        baseId = result.baseId;
        tableId = result.tableId;
        
        if (task.apiKeySource === 'airtable' && (!baseId || !tableId)) {
          throw new Error(`Missing Airtable Base ID or Table ID. Please configure these in your settings.`);
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
  }
} 