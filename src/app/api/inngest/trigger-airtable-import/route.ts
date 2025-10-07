import { NextRequest, NextResponse } from "next/server";
import { authService, airtableService } from "@/services";
import { inngest } from "@/inngest";

export async function POST(request: NextRequest) {
  // Get the auth token from the request headers
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  
  try {
    // Validate the token and get the user
    const { data: { user } } = await authService.validateToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    const userId = body.userId || user.id;
    const apiKey = body.apiKey;
    const baseId = body.baseId;
    const tableId = body.tableId;
    
    console.log('Airtable import parameters:', { 
      userId, 
      hasApiKey: !!apiKey, 
      baseId, 
      tableId 
    });
    
    // Validate required parameters using the service
    const validation = airtableService.validateImportData(userId, apiKey, baseId, tableId);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    // Validate user permissions if the requester wants to run for a different user
    if (userId !== user.id) {
      // Only allow admins to run for other users
      // This would need a proper role check in a real system
      return NextResponse.json({ error: 'Unauthorized to run task for another user' }, { status: 403 });
    }
    
    // Get the import data from the service
    const importData = airtableService.prepareImportData(userId, apiKey, baseId, tableId);
    
    // Send the Inngest event to import sparks from Airtable
    await inngest.send({
      name: "airtable/import-sparks",
      data: importData
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering Airtable import:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 