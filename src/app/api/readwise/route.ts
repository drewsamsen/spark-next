import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// This endpoint will be called by Inngest after the background job completes
// to update the user's settings with the results of the Readwise API call
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const { userId, bookCount, syncTime } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Create Supabase server client
    const supabase = createServerClient();
    
    // First get the current settings
    const { data: currentData, error: fetchError } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('id', userId)
      .single();
    
    if (fetchError) {
      console.error('API: Error fetching user settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user settings' },
        { status: 500 }
      );
    }
    
    const currentSettings = currentData?.settings || {};
    
    // Update the Readwise settings
    const updatedSettings = {
      ...currentSettings,
      integrations: {
        ...currentSettings.integrations,
        readwise: {
          ...currentSettings.integrations?.readwise,
          bookCount: bookCount,
          lastSyncTime: syncTime || new Date().toISOString()
        }
      }
    };
    
    // Update the settings in the database
    const { error: updateError } = await supabase
      .from('user_settings')
      .upsert({ 
        id: userId, 
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      });
    
    if (updateError) {
      console.error('API: Error updating user settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user settings' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 