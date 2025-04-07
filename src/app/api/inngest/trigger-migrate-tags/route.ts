import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest";
import { categorizationService } from "@/services";
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const userId = body.userId;
    
    // Validate input parameters using the service
    const validation = categorizationService.validateTagMigrationData(userId);
    if (!validation.valid) {
      return createErrorResponse(validation.error || 'Invalid input data', 400);
    }

    // Authenticate the request
    const authResult = await authenticateRequest(request, userId);
    if (authResult.error) {
      return authResult.error;
    }
    
    // Get the migration data from the service
    const migrationData = categorizationService.prepareTagMigrationData(userId);

    // Trigger the Inngest event
    await inngest.send({
      name: "tags/migrate-highlight-tags",
      data: migrationData
    });
    
    return createSuccessResponse(
      { triggered: true }, 
      'Highlight tag migration automation triggered successfully'
    );
  } catch (error) {
    console.error('Error triggering highlight tag migration:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
} 