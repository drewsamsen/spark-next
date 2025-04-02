import { getRepositories } from '@/repositories';
import { FunctionLogModel, FunctionLogsFilter } from '@/repositories/function-logs.repository';
import { handleServiceError } from '@/lib/errors';

/**
 * Service for handling function logs operations
 */
export const functionLogsService = {
  /**
   * Get function logs for the current user with optional filters
   */
  async getFunctionLogs(
    filters: FunctionLogsFilter = {}
  ): Promise<{ logs: FunctionLogModel[], count: number }> {
    try {
      const repo = getRepositories().functionLogs;
      const result = await repo.getFunctionLogs(filters);
      return result;
    } catch (error) {
      console.error('Error in functionLogsService.getFunctionLogs:', error);
      return { logs: [], count: 0 };
    }
  },

  /**
   * Format date for display
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  },

  /**
   * Format duration for display
   */
  formatDuration(durationMs: number | null): string {
    if (!durationMs) return "—";
    return `${(durationMs / 1000).toFixed(2)}s`;
  }
}; 