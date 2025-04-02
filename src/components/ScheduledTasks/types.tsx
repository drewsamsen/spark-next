/**
 * Interface for a scheduled task
 */
export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  // Schedule options in the future will go here
  isSchedulable: boolean;
  triggerEndpoint: string;
  requiresApiKey?: boolean;
  apiKeySource?: string;
}

/**
 * Task running state record
 */
export type TaskRunningState = Record<string, boolean>; 