import { NextRequest, NextResponse } from 'next/server';
import { createCustomClaims } from '@/lib/auth-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ ok: false, error: 'Not allowed in production' }, { status: 403 });
    }

    // Parse form data instead of JSON
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing email or password' 
      }, { status: 400 });
    }

    // Check if it's our test admin (merchant admin)
    if (email === 'admin@test.com' && password === 'TestPassword123!') {
      // Create a redirect response with cookies
      const redirectUrl = '/admin/demo-store/overview';
      const response = NextResponse.redirect(new URL(redirectUrl, req.url));

      // Set the necessary cookies for middleware
      response.cookies.set('session', 'dev-session-token', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('uid', 'dev-admin-123', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('user_type', 'merchant_admin', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('email', 'admin@test.com', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('role', 'admin', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('tenant_id', 'EP7BbCWm0JFvhjwBtcEs', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('tenant_slug', 'demo-store', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });

      return response;
    }

    // Check if it's our test platform admin
    if (email === 'fnissan.q8@gmail.com' && password === 'TestPassword123!') {
      // Create a redirect response with cookies
      const redirectUrl = '/admin/platform';
      const response = NextResponse.redirect(new URL(redirectUrl, req.url));

      // Set the necessary cookies for middleware
      response.cookies.set('session', 'dev-platform-session-token', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('uid', 'dev-platform-admin-123', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('user_type', 'platform_admin', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('email', 'fnissan.q8@gmail.com', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('role', 'SUPER_ADMIN', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });

      return response;
    }

    return NextResponse.json({ 
      ok: false, 
      error: 'Invalid credentials' 
    }, { status: 401 });

  } catch (error: any) {
    console.error('Auth bypass error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Authentication failed'
    }, { status: 500 });
  }
}
