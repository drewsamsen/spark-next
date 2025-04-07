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

    // Send the Inngest event manually
    await inngest.send({
      name: "readwise/daily-sync",
      data: {
        timestamp: new Date().toISOString()
      }
    });

    return createSuccessResponse(
      { triggered: true }, 
      'Readwise daily sync automation triggered manually'
    );
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to trigger Readwise sync automation'
    );
  }
}

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic'; 