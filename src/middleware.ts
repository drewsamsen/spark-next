import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from './lib/supabase';

export async function middleware(request: NextRequest) {
  try {
    // Get response and modify as needed
    const response = NextResponse.next();
    
    // Create Supabase client for server
    const supabase = createServerClient();
    
    // Get current auth session
    const { data: { session } } = await supabase.auth.getSession();
    
    // If authenticated, try to fetch user settings
    if (session) {
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('id', session.user.id)
        .single();
      
      // Set user settings in cookies for access in client components
      if (userSettings?.settings) {
        // Get theme from user settings (fallback to 'light')
        const theme = userSettings.settings.theme === 'dark' ? 'dark' : 'light';
        
        // Add theme to cookies
        response.cookies.set({
          name: 'theme',
          value: theme,
          path: '/',
          sameSite: 'lax',
          // Don't make the cookie secure in development
          secure: process.env.NODE_ENV === 'production',
          // Set max age to 30 days
          maxAge: 60 * 60 * 24 * 30
        });
      }
    }
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

// Only run middleware on pages that need user settings
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 