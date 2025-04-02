import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services';
import { AuthenticatedUser } from './types';

/**
 * Interface for authentication result specific to API routes
 */
export interface AuthResult {
  user: AuthenticatedUser | null;
  error: NextResponse | null;
}

/**
 * Authenticate a request using the Authorization header
 * This handles token extraction, validation, and user retrieval
 */
export async function authenticateRequest(
  request: NextRequest, 
  requiredUserId?: string
): Promise<AuthResult> {
  // Check for Authorization header
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    };
  }

  // Extract token
  const token = authHeader.split(' ')[1];
  
  // Validate token using auth service
  const { data: { user }, error: authError } = await authService.validateToken(token);
  
  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    };
  }

  // If a specific user ID is required, check that the authenticated user matches
  if (requiredUserId && user.id !== requiredUserId) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized: Cannot access another user\'s data' },
        { status: 403 }
      )
    };
  }

  return {
    user,
    error: null
  };
}

/**
 * Create an error response with standardized format
 */
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Create a success response with standardized format
 */
export function createSuccessResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data
  });
} 