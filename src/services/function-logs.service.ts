import { getRepositories } from '@/repositories';
import { FunctionLogModel, FunctionLogsFilter } from '@/lib/types';
import { handleServiceError } from '@/lib/errors';
import { BaseService } from './base.service';
import { FunctionLogsRepository } from '@/repositories/function-logs.repository';

/**
 * Service for handling function logs operations
 */
class FunctionLogsService extends BaseService<FunctionLogModel, FunctionLogsRepository> {
  constructor() {
    super(getRepositories().functionLogs);
  }

  /**
   * Get function logs for the current user with optional filters
   */
  async getFunctionLogs(
    filters: FunctionLogsFilter = {}
  ): Promise<{ logs: FunctionLogModel[], count: number }> {
    try {
      const result = await this.repository.getFunctionLogs(filters);
      return result;
    } catch (error) {
      console.error('Error in FunctionLogsService.getFunctionLogs:', error);
      return { logs: [], count: 0 };
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  }

  /**
   * Format duration for display
   */
  formatDuration(durationMs: number | null): string {
    if (!durationMs) return "—";
    return `${(durationMs / 1000).toFixed(2)}s`;
  }
}

/**
 * Export a singleton instance of the FunctionLogsService
 */
export const functionLogsService = new FunctionLogsService(); 