import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { inngest } from '@/../inngest.config';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const { userId, apiKey } = await request.json();

    if (!userId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing userId or apiKey' },
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
    const supabase = createServerClient();
    
    // Verify the token
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Ensure the requesting user is the same as the userId in the payload
    if (authData.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access another user\'s data' },
        { status: 403 }
      );
    }

    // Send the Inngest event
    await inngest.send({
      name: "readwise/fetch-books",
      data: {
        userId,
        apiKey
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Readwise sync job triggered successfully'
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Readwise sync job' },
      { status: 500 }
    );
  }
} 