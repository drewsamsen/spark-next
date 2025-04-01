import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  // Get the auth token from the request headers
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  // Validate the token and get the user
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    console.error('Authentication error:', authError);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  try {
    // Parse the request body
    const body = await request.json();
    const userId = body.userId || user.id;
    
    // Validate user permissions if the requester wants to run for a different user
    if (userId !== user.id) {
      // Only allow admins to run for other users
      // This would need a proper role check in a real system
      return NextResponse.json({ error: 'Unauthorized to run task for another user' }, { status: 403 });
    }
    
    // Trigger the Inngest event
    await inngest.send({
      name: "tags/migrate-highlight-tags",
      data: { userId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering highlight tag migration:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 