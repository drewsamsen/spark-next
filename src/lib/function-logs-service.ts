import { createServerClient } from './supabase';

// Types for function logging
export interface FunctionLogInput {
  function_name: string;
  function_id: string; 
  user_id?: string;
  run_id: string;  // Required - this is critical for uniqueness
  input_params?: any;
}

export interface FunctionLogUpdate {
  status: 'started' | 'completed' | 'failed';
  result_data?: any;
  error_message?: string;
  error_stack?: string;
  completed_at?: Date;
  duration_ms?: number;
}

/**
 * Service for logging Inngest function executions
 */
export class FunctionLogsService {
  /**
   * Log the start of a function execution
   */
  static async logFunctionStart(params: FunctionLogInput): Promise<string | null> {
    try {
      // Validation - ensure required fields are present
      if (!params.function_name) {
        console.error('Missing required field: function_name');
        return null;
      }
      
      if (!params.run_id) {
        console.error('Missing required field: run_id');
        return null;
      }
      
      // If function_id is missing, use function_name as fallback
      const function_id = params.function_id || params.function_name;
      
      // First check if a log already exists for this run_id to prevent duplicates
      const supabase = createServerClient();
      const { data: existingLog } = await supabase
        .from('function_logs')
        .select('id')
        .eq('run_id', params.run_id)
        .maybeSingle();
      
      // If a log already exists, return its ID instead of creating a new one
      if (existingLog?.id) {
        console.log(`Log already exists for run_id ${params.run_id}: ${existingLog.id}`);
        return existingLog.id;
      }
      
      // Create a new log entry
      const { data, error } = await supabase
        .from('function_logs')
        .insert({
          function_name: params.function_name,
          function_id: function_id,
          user_id: params.user_id,
          run_id: params.run_id,
          status: 'started',
          input_params: params.input_params
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error logging function start:', error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Error in logFunctionStart:', error);
      return null;
    }
  }
  
  /**
   * Update a function log entry when a function completes or fails
   */
  static async updateFunctionLog(logId: string, update: FunctionLogUpdate): Promise<boolean> {
    if (!logId) {
      console.error('Cannot update function log: logId is required');
      return false;
    }
    
    try {
      console.log(`Updating function log ${logId} with status: ${update.status}`);
      const supabase = createServerClient();
      
      // Calculate duration if completed_at is provided but duration_ms is not
      let updateData: FunctionLogUpdate = { ...update };
      
      if (update.status === 'completed' || update.status === 'failed') {
        // Set completed_at if not provided
        if (!updateData.completed_at) {
          updateData.completed_at = new Date();
        }
        
        // Get the original record to calculate duration
        if (!updateData.duration_ms) {
          const { data: originalLog, error: fetchError } = await supabase
            .from('function_logs')
            .select('started_at, status')
            .eq('id', logId)
            .single();
          
          if (fetchError) {
            console.error(`Error fetching original log for ${logId}:`, fetchError);
          } else {
            console.log(`Original log for ${logId}:`, originalLog);
            
            if (originalLog?.started_at) {
              const startedAt = new Date(originalLog.started_at);
              const completedAt = new Date(updateData.completed_at);
              updateData.duration_ms = completedAt.getTime() - startedAt.getTime();
              console.log(`Calculated duration: ${updateData.duration_ms}ms`);
            }
          }
        }
      }
      
      // Perform the update
      const { error } = await supabase
        .from('function_logs')
        .update(updateData)
        .eq('id', logId);
      
      if (error) {
        console.error(`Error updating function log ${logId}:`, error);
        return false;
      }
      
      console.log(`Successfully updated function log ${logId} to ${update.status}`);
      return true;
    } catch (error) {
      console.error(`Error in updateFunctionLog for ${logId}:`, error);
      return false;
    }
  }
  
  /**
   * Get function logs for a specific user
   */
  static async getUserFunctionLogs(userId: string, options?: {
    limit?: number;
    offset?: number;
    function_name?: string;
    status?: 'started' | 'completed' | 'failed';
    order_by?: string;
    order_direction?: 'asc' | 'desc';
  }) {
    try {
      const {
        limit = 20,
        offset = 0,
        function_name,
        status,
        order_by = 'started_at',
        order_direction = 'desc'
      } = options || {};
      
      const supabase = createServerClient();
      
      let query = supabase
        .from('function_logs')
        .select('*')
        .eq('user_id', userId)
        .order(order_by, { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);
      
      // Apply filters if provided
      if (function_name) {
        query = query.eq('function_name', function_name);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching user function logs:', error);
        return { logs: [], error: error.message };
      }
      
      return { logs: data || [], count };
    } catch (error) {
      console.error('Error in getUserFunctionLogs:', error);
      return { logs: [], error: 'An unexpected error occurred' };
    }
  }
  
  /**
   * Get all function logs (for admin use)
   */
  static async getAllFunctionLogs(options?: {
    limit?: number;
    offset?: number;
    function_name?: string;
    status?: 'started' | 'completed' | 'failed';
    user_id?: string;
    order_by?: string;
    order_direction?: 'asc' | 'desc';
  }) {
    try {
      const {
        limit = 50,
        offset = 0,
        function_name,
        status,
        user_id,
        order_by = 'started_at',
        order_direction = 'desc'
      } = options || {};
      
      const supabase = createServerClient();
      
      let query = supabase
        .from('function_logs')
        .select('*', { count: 'exact' })
        .order(order_by, { ascending: order_direction === 'asc' })
        .range(offset, offset + limit - 1);
      
      // Apply filters if provided
      if (function_name) {
        query = query.eq('function_name', function_name);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching all function logs:', error);
        return { logs: [], error: error.message };
      }
      
      return { logs: data || [], count };
    } catch (error) {
      console.error('Error in getAllFunctionLogs:', error);
      return { logs: [], error: 'An unexpected error occurred' };
    }
  }
} 