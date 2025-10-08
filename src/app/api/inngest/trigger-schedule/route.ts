import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request without requiring a specific user ID
    const authResult = await authenticateRequest(request);
    if (authResult.error) {
      return authResult.error;
    }

    // Send the manual trigger event for scheduled tasks
    await inngest.send({
      name: "scheduled-tasks/manual-trigger",
      data: {
        triggeredBy: authResult.userId,
        timestamp: new Date().toISOString()
      }
    });

    return createSuccessResponse(
      { triggered: true }, 
      'Scheduled tasks cron triggered manually'
    );
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to trigger scheduled tasks'
    );
  }
}

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic'; 