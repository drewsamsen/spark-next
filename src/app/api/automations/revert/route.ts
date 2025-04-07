import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { AutomationServiceImpl } from '@/lib/categorization/automation-service';
import { getRepositories, getServerRepositories } from '@/repositories';

/**
 * Server-side endpoint for reverting automations
 * This executes with the service role client to bypass RLS restrictions
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { automationId } = await request.json();

    if (!automationId) {
      return NextResponse.json({ success: false, error: 'Missing automationId' }, { status: 400 });
    }

    // Create server client with service role
    const supabase = createServerClient();
    
    // Get the user's session
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Verify user owns this automation
    const { data: automation } = await supabase
      .from('automations')
      .select('user_id, status')
      .eq('id', automationId)
      .single();

    if (!automation) {
      return NextResponse.json({ success: false, error: 'Automation not found' }, { status: 404 });
    }

    if (automation.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Not authorized to revert this automation' }, { status: 403 });
    }

    // Verify the automation is in approved status
    if (automation.status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: `Can only revert approved automations, current status: ${automation.status}` 
      }, { status: 400 });
    }

    // Create a special server-side service for automations
    class ServerAutomationService extends AutomationServiceImpl {
      // Implement server-side revert function that uses the service role
      async serverRevertAutomation(automationId: string) {
        const repos = getServerRepositories();
        
        try {
          console.log(`Reverting automation ${automationId} using repository pattern`);
          
          // Update automation status to reverted using repository methods
          await repos.automations.updateAutomationStatus(automationId, 'reverted');
          
          // Mark all executed actions as reverted
          await repos.automations.updateAllActionStatusForAutomation(automationId, 'reverted', { currentStatus: 'executed' });
          
          // Get all executed actions for this automation to revert their effects
          await repos.automations.revertAutomationActions(automationId);
          
          return { success: true, automationId };
        } catch (error) {
          console.error('Error reverting automation:', error);
          
          if (error instanceof Error && 'details' in error) {
            console.error('Database error details:', error.details);
          }
          
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }

    // Execute the automation reversion with server permissions
    const serverAutomationService = new ServerAutomationService();
    const result = await serverAutomationService.serverRevertAutomation(automationId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in revert automation endpoint:', error);
    
    // Add more detailed error logging for database errors
    if (error instanceof Error && 'details' in error) {
      console.error('Database error details:', error.details);
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 