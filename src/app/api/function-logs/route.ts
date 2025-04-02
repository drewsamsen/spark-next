import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';
import { FunctionLogsService } from '@/lib/function-logs-service';

// GET handler for fetching logs
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateRequest(request);
    if (authError || !user) {
      return authError || createErrorResponse('Authentication failed', 401);
    }
    
    const { searchParams } = new URL(request.url);
    
    // Get query params for filtering and pagination
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const functionName = searchParams.get('function_name') || undefined;
    const status = searchParams.get('status') as 'started' | 'completed' | 'failed' | undefined;
    const orderBy = searchParams.get('order_by') || 'started_at';
    const orderDirection = searchParams.get('order_direction') as 'asc' | 'desc' | undefined;
    
    // Fetch the logs using the service
    const { logs, count, error } = await FunctionLogsService.getUserFunctionLogs(user.id, {
      limit,
      offset,
      function_name: functionName,
      status,
      order_by: orderBy,
      order_direction: orderDirection || 'desc'
    });
    
    if (error) {
      return createErrorResponse(error);
    }
    
    return createSuccessResponse({
      logs,
      pagination: {
        total: count,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error in function logs API:', error);
    return createErrorResponse('Failed to fetch function logs');
  }
} 