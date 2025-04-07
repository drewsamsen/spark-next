import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest';
import { authService, integrationsService } from '@/services';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const { userId, apiKey } = await request.json();

    // Validate input parameters using the service
    const validation = integrationsService.validateReadwiseConnectionData(userId, apiKey);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Validate the token using the auth service
    const { data: { user }, error: authError } = await authService.validateToken(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Ensure the requesting user is the same as the userId in the payload
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access another user\'s data' },
        { status: 403 }
      );
    }

    // Get the connection data from the service
    const connectionData = integrationsService.prepareReadwiseConnectionData(userId, apiKey);

    // Send the Inngest event
    await inngest.send({
      name: "readwise/count-books",
      data: connectionData
    });

    return NextResponse.json({
      success: true,
      message: 'Readwise book count automation triggered successfully'
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Readwise book count automation' },
      { status: 500 }
    );
  }
}

// Add the dynamic export to force this to be a dynamic route
export const dynamic = 'force-dynamic'; 