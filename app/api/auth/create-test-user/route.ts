import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateTestUserRequest {
  email: string;
  password: string;
  markVerified?: boolean;
  claims?: Record<string, any>;
}

interface CreateTestUserResponse {
  ok: boolean;
  created?: boolean;
  uid?: string;
  claims?: Record<string, any>;
  code?: string;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateTestUserResponse>> {
  try {
    // Production guardrail - allow in preview/development
    const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production';
    if (isProduction) {
      // Check for debug key header or allow if DEBUG_SECRET_KEY is not set
      const debugKey = request.headers.get('x-debug-key');
      const expectedDebugKey = process.env.DEBUG_SECRET_KEY;
      
      if (expectedDebugKey && debugKey !== expectedDebugKey) {
        return NextResponse.json({
          ok: false,
          code: 'PRODUCTION_RESTRICTED',
          message: 'Test user creation is restricted in production. Provide x-debug-key header.'
        }, { status: 403 });
      }
      
      // Log production usage for security monitoring
      console.warn('[CREATE-TEST-USER] Production usage detected:', {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        timestamp: new Date().toISOString()
      });
    }

    const body: CreateTestUserRequest = await request.json();
    const { email, password, markVerified = true, claims = { role: 'platform_admin' } } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({
        ok: false,
        code: 'MISSING_FIELDS',
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        ok: false,
        code: 'INVALID_EMAIL',
        message: 'Invalid email format'
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({
        ok: false,
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    let userRecord;
    let wasCreated = false;

    try {
      // Check if user already exists
      userRecord = await adminAuth.getUserByEmail(email);
      console.log(`[CREATE-TEST-USER] User already exists: ${email} (UID: ${userRecord.uid})`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create it
        try {
          userRecord = await adminAuth.createUser({
            email,
            password,
            emailVerified: markVerified,
          });
          wasCreated = true;
          console.log(`[CREATE-TEST-USER] User created: ${email} (UID: ${userRecord.uid})`);
        } catch (createError: any) {
          console.error('[CREATE-TEST-USER] Error creating user:', createError);
          
          if (createError.code === 'auth/email-already-exists') {
            return NextResponse.json({
              ok: false,
              code: 'EMAIL_EXISTS',
              message: 'User with this email already exists'
            }, { status: 409 });
          }
          
          if (createError.code === 'auth/weak-password') {
            return NextResponse.json({
              ok: false,
              code: 'WEAK_PASSWORD',
              message: 'Password is too weak'
            }, { status: 400 });
          }

          return NextResponse.json({
            ok: false,
            code: createError.code || 'CREATE_USER_FAILED',
            message: createError.message || 'Failed to create user'
          }, { status: 500 });
        }
      } else {
        // Other error
        console.error('[CREATE-TEST-USER] Error checking user:', error);
        return NextResponse.json({
          ok: false,
          code: error.code || 'CHECK_USER_FAILED',
          message: error.message || 'Failed to check user existence'
        }, { status: 500 });
      }
    }

    // Set custom claims if provided
    if (Object.keys(claims).length > 0) {
      try {
        await adminAuth.setCustomUserClaims(userRecord.uid, claims);
        console.log(`[CREATE-TEST-USER] Custom claims set for ${email}:`, claims);
      } catch (claimsError: any) {
        console.error('[CREATE-TEST-USER] Error setting custom claims:', claimsError);
        // Don't fail the request if claims setting fails
      }
    }

    return NextResponse.json({
      ok: true,
      created: wasCreated,
      uid: userRecord.uid,
      claims: Object.keys(claims).length > 0 ? claims : undefined,
    });

  } catch (error: any) {
    console.error('[CREATE-TEST-USER] Unexpected error:', error);
    return NextResponse.json({
      ok: false,
      code: 'UNEXPECTED_ERROR',
      message: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
