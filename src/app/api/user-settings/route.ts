import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, createErrorResponse, createSuccessResponse } from '@/lib/api-utils';
import { DEFAULT_USER_SETTINGS } from '@/lib/types';
import * as UserSettingsService from '@/lib/user-settings-service';

// GET /api/user-settings
export async function GET(request: NextRequest) {
  console.log('API: GET /api/user-settings');
  
  // Authenticate the request
  const { user, error: authError } = await authenticateRequest(request);
  if (authError || !user) {
    return authError || createErrorResponse('Authentication failed', 401);
  }
  
  // Check if a specific integration is requested
  const url = new URL(request.url);
  const integration = url.searchParams.get('integration');
  console.log('API: Requested integration:', integration);
  
  try {
    // Get user settings using the service
    const settings = await UserSettingsService.getUserSettings(user.id);
    
    // If requesting a specific integration, only return that part
    if (integration && settings?.integrations) {
      // Type-safe access to integrations
      const integrationSettings = integration === 'readwise' 
        ? settings.integrations.readwise 
        : integration === 'airtable'
          ? settings.integrations.airtable
          : undefined;
      
      console.log(`API: Returning ${integration} settings:`, integrationSettings);
      return NextResponse.json(integrationSettings || {});
    }
    
    // Return all user settings
    return NextResponse.json(settings || DEFAULT_USER_SETTINGS);
  } catch (error) {
    console.error('API: Error fetching user settings:', error);
    return createErrorResponse('Failed to fetch user settings');
  }
}

// PUT /api/user-settings
export async function PUT(request: NextRequest) {
  console.log('API: PUT /api/user-settings');
  
  // Authenticate the request
  const { user, error: authError } = await authenticateRequest(request);
  if (authError || !user) {
    return authError || createErrorResponse('Authentication failed', 401);
  }
  
  try {
    // Get the request body
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      console.log('API: Invalid request body');
      return createErrorResponse('Invalid request body', 400);
    }
    
    // Update the settings using the service
    const { success, error } = await UserSettingsService.updateUserSettings(user.id, body);
    
    if (!success) {
      console.error('API: Error updating user settings:', error);
      return createErrorResponse(error || 'Failed to update user settings');
    }
    
    // Fetch the updated settings to return to the client
    const updatedSettings = await UserSettingsService.getUserSettings(user.id);
    
    console.log('API: Successfully updated user settings');
    return createSuccessResponse({
      settings: updatedSettings
    }, 'Settings updated successfully');
  } catch (error) {
    console.error('API: Error updating user settings:', error);
    return createErrorResponse('Failed to update user settings');
  }
}

// PATCH /api/user-settings
export async function PATCH(request: NextRequest) {
  console.log('API: PATCH /api/user-settings');
  
  // Authenticate the request
  const { user, error: authError } = await authenticateRequest(request);
  if (authError || !user) {
    return authError || createErrorResponse('Authentication failed', 401);
  }
  
  try {
    // Get the request body
    const body = await request.json();
    console.log('API: PATCH request body:', body);
    
    if (!body || typeof body !== 'object') {
      console.log('API: Invalid request body');
      return createErrorResponse('Invalid request body', 400);
    }
    
    if (!Object.keys(body).length) {
      console.log('API: No settings to update');
      return createErrorResponse('No settings to update', 400);
    }
    
    // Update the settings using the service
    // The service already handles deep merging of settings
    const { success, error } = await UserSettingsService.updateUserSettings(user.id, body);
    
    if (!success) {
      console.error('API: Error updating user settings:', error);
      return createErrorResponse(error || 'Failed to update user settings');
    }
    
    // Fetch the updated settings to return to the client
    const updatedSettings = await UserSettingsService.getUserSettings(user.id);
    
    console.log('API: Successfully updated user settings');
    return createSuccessResponse({
      settings: updatedSettings
    }, 'Settings updated successfully');
  } catch (error) {
    console.error('API: Error updating user settings:', error);
    return createErrorResponse('Failed to update user settings');
  }
} 