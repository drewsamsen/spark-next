import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * Diagnostic endpoint to verify the automations table schema and constraints
 */
export async function GET(request: NextRequest) {
  try {
    // Create server client with service role
    const supabase = createServerClient();
    
    // Check for valid authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get basic table information
    const { data: tables, error: tablesError } = await supabase
      .from('automations')
      .select('id, status')
      .limit(1);
    
    // Check if 'reverted' status is allowed
    const { error: statusError } = await supabase
      .from('automations')
      .update({ status: 'reverted' })
      .eq('id', '00000000-0000-0000-0000-000000000000');  // Non-existent ID
    
    const isConstraintError = statusError && 
      statusError.message.includes('violates check constraint') && 
      statusError.message.includes('status');
    
    return NextResponse.json({
      success: true,
      tableExists: !tablesError,
      revertedStatusAllowed: !isConstraintError,
      statusError: isConstraintError ? statusError.message : null
    });
  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 