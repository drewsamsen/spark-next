import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { FunctionLogsService } from '@/lib/function-logs-service';

// GET handler for fetching logs
export async function GET(request: NextRequest) {
  try {
    // Get auth header from the request
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Authenticate the user from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    
    // Validate the token and get user info
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData?.user) {
      console.error('Auth error in function logs API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = userData.user.id;
    
    // Get query params for filtering and pagination
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const functionName = searchParams.get('function_name') || undefined;
    const status = searchParams.get('status') as 'started' | 'completed' | 'failed' | undefined;
    const orderBy = searchParams.get('order_by') || 'started_at';
    const orderDirection = searchParams.get('order_direction') as 'asc' | 'desc' | undefined;
    
    // Fetch the logs
    const { logs, count, error } = await FunctionLogsService.getUserFunctionLogs(userId, {
      limit,
      offset,
      function_name: functionName,
      status,
      order_by: orderBy,
      order_direction: orderDirection || 'desc'
    });
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json({
      logs,
      pagination: {
        total: count,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error in function logs API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch function logs' },
      { status: 500 }
    );
  }
} 