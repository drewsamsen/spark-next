/**
 * Interface for a scheduled task
 */
export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  isSchedulable: boolean;
  triggerEndpoint: string;
  requiresApiKey?: boolean;
  apiKeySource?: string;
}

/**
 * Task schedule configuration
 */
export interface TaskScheduleConfig {
  enabled: boolean;
  frequency: 'off' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  lastRun?: string;
}

/**
 * Task running state record
 */
export type TaskRunningState = Record<string, boolean>; 