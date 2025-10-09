import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

/**
 * POST /api/inngest/trigger-generate-embeddings
 * 
 * Manually trigger the embeddings generation function
 * 
 * This endpoint allows users to manually trigger the generation of embeddings
 * for their highlights, which enables semantic search functionality.
 */
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const { userId } = await request.json();

    // Validate input parameters
    if (!userId) {
      return createErrorResponse('userId is required', 400);
    }

    // Authenticate the request
    const authResult = await authenticateRequest(request, userId);
    if (authResult.error) {
      return authResult.error;
    }

    // Send the Inngest event
    await inngest.send({
      name: "embeddings/generate-highlight-embeddings",
      data: {
        userId
      }
    });

    return createSuccessResponse(
      { triggered: true }, 
      'Embeddings generation triggered successfully'
    );
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to trigger embeddings generation'
    );
  }
}

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic';

