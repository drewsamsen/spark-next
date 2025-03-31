import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { UserSettings, DEFAULT_USER_SETTINGS } from '@/lib/types';

// Helper function to get and verify the auth token
async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient();
  
  // Get bearer token from Authorization header
  const authHeader = request.headers.get('Authorization');
  console.log('API: Auth header present:', !!authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('API: Missing or invalid Authorization header');
    return { user: null, error: 'Missing or invalid Authorization header' };
  }
  
  const token = authHeader.split(' ')[1];
  console.log('API: Got token from header');
  
  try {
    // Verify the token and get user information
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('API: Auth verification failed:', error?.message);
      return { user: null, error: error?.message || 'Authentication failed' };
    }
    
    console.log('API: User authenticated:', data.user.id);
    return { user: data.user, error: null };
  } catch (error) {
    console.error('API: Auth verification error:', error);
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    };
  }
}

// GET /api/user-settings
export async function GET(request: NextRequest) {
  console.log('API: GET /api/user-settings');
  
  // Check authentication
  const { user, error: authError } = await getAuthenticatedUser(request);
  
  if (!user) {
    console.log('API: Authentication failed:', authError);
    return NextResponse.json(
      { error: authError || 'Not authenticated' },
      { status: 401 }
    );
  }
  
  const userId = user.id;
  const supabase = createServerClient();
  
  try {
    // Get user settings
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (error) {
      // PGRST116 is the Postgres error code for "no rows returned" in single mode
      if (error.code === 'PGRST116') {
        console.log('API: No settings found for user, returning defaults');
        return NextResponse.json(DEFAULT_USER_SETTINGS);
      }
      
      console.error('API: Error getting settings:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch user settings' },
        { status: 500 }
      );
    }
    
    console.log('API: Successfully fetched user settings');
    // Return the user settings, or defaults if none found
    return NextResponse.json(data?.settings || DEFAULT_USER_SETTINGS);
  } catch (error) {
    console.error('API: Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

// PUT /api/user-settings
export async function PUT(request: NextRequest) {
  console.log('API: PUT /api/user-settings');
  
  // Check authentication
  const { user, error: authError } = await getAuthenticatedUser(request);
  
  if (!user) {
    console.log('API: Authentication failed:', authError);
    return NextResponse.json(
      { error: authError || 'Not authenticated' },
      { status: 401 }
    );
  }
  
  const userId = user.id;
  const supabase = createServerClient();
  
  try {
    // Get the request body
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      console.log('API: Invalid request body');
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // First get the current settings
    const { data: currentData } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    // Merge current settings with the new settings
    const updatedSettings = {
      ...(currentData?.settings || DEFAULT_USER_SETTINGS),
      ...body
    };
    
    // Update the settings in the database
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        id: userId, 
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('API: Error updating user settings:', error);
      return NextResponse.json(
        { error: 'Failed to update user settings' },
        { status: 500 }
      );
    }
    
    console.log('API: Successfully updated user settings');
    return NextResponse.json({ 
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('API: Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/user-settings
export async function PATCH(request: NextRequest) {
  console.log('API: PATCH /api/user-settings');
  
  // Check authentication
  const { user, error: authError } = await getAuthenticatedUser(request);
  
  if (!user) {
    console.log('API: Authentication failed:', authError);
    return NextResponse.json(
      { error: authError || 'Not authenticated' },
      { status: 401 }
    );
  }
  
  const userId = user.id;
  const supabase = createServerClient();
  
  try {
    // Get the request body
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      console.log('API: Invalid request body');
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    if (!Object.keys(body).length) {
      console.log('API: No settings to update');
      return NextResponse.json(
        { error: 'No settings to update' },
        { status: 400 }
      );
    }
    
    // First get the current settings
    const { data: currentData } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    // Deep merge current settings with the new settings
    const mergeDeep = (target: any, source: any) => {
      const output = { ...target };
      
      if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
          if (isObject(source[key])) {
            if (!(key in target)) {
              Object.assign(output, { [key]: source[key] });
            } else {
              output[key] = mergeDeep(target[key], source[key]);
            }
          } else {
            Object.assign(output, { [key]: source[key] });
          }
        });
      }
      
      return output;
    };
    
    const isObject = (item: any) => {
      return (item && typeof item === 'object' && !Array.isArray(item));
    };
    
    const updatedSettings = mergeDeep(
      currentData?.settings || DEFAULT_USER_SETTINGS,
      body
    );
    
    // Update the settings in the database
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        id: userId, 
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('API: Error updating user settings:', error);
      return NextResponse.json(
        { error: 'Failed to update user settings' },
        { status: 500 }
      );
    }
    
    console.log('API: Successfully updated user settings');
    return NextResponse.json({ 
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('API: Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
} 