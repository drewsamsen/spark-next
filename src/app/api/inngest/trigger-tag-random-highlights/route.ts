import { NextRequest } from 'next/server';
import { inngest } from '@/inngest';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const { userId } = await request.json();

    // Validate user ID
    if (!userId) {
      return createErrorResponse('Missing userId in request body', 400);
    }

    // Authenticate the request
    const authResult = await authenticateRequest(request, userId);
    if (authResult.error) {
      return authResult.error;
    }

    // Trigger the Inngest event
    await inngest.send({
      name: "automations/tag-random-highlights",
      data: { userId }
    });
    
    return createSuccessResponse(
      { triggered: true }, 
      'Random highlight tagging automation triggered successfully'
    );
  } catch (error) {
    console.error('Error triggering random highlight tagging automation:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic'; 