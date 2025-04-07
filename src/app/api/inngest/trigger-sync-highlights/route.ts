import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest';
import { integrationsService } from '@/services';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const { userId, apiKey, fullSync = false } = await request.json();

    // Validate input parameters using the service
    const validation = integrationsService.validateReadwiseSyncData(userId, apiKey, fullSync);
    if (!validation.valid) {
      return createErrorResponse(validation.error || 'Invalid input data', 400);
    }

    // Authenticate the request
    const authResult = await authenticateRequest(request, userId);
    if (authResult.error) {
      return authResult.error;
    }

    // Get the sync data from the service
    const syncData = integrationsService.prepareReadwiseSyncData(userId, apiKey, fullSync);

    // Send the Inngest event
    await inngest.send({
      name: "readwise/sync-highlights",
      data: syncData
    });

    return createSuccessResponse(
      { triggered: true }, 
      'Readwise highlights sync automation triggered successfully'
    );
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to trigger Readwise highlights sync automation'
    );
  }
}

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic'; 