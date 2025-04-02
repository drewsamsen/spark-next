import { BaseRepository } from './base.repository';
import { handleServiceError } from '@/lib/errors';
import { FunctionLogModel, FunctionLogsFilter } from '@/lib/types';

export class FunctionLogsRepository extends BaseRepository {
  /**
   * Get function logs for the current user with optional filters
   */
  async getFunctionLogs(filters: FunctionLogsFilter = {}): Promise<{ logs: FunctionLogModel[], count: number }> {
    try {
      const userId = await this.getUserId();
      
      const {
        limit = 20,
        offset = 0,
        function_name,
        status,
        order_by = 'started_at',
        order_direction = 'desc'
      } = filters;
      
      let query = this.client
        .from('function_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order(order_by, { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);
      
      // Apply filters if provided
      if (function_name) {
        query = query.ilike('function_name', `%${function_name}%`);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        throw error;
      }
      
      return { 
        logs: (data || []) as FunctionLogModel[], 
        count: count || 0 
      };
    } catch (error) {
      console.error('Error in FunctionLogsRepository.getFunctionLogs:', error);
      return { logs: [], count: 0 };
    }
  }
} 