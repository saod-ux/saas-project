import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ ok: false, error: 'Not allowed in production' }, { status: 403 });
    }

    // Parse form data
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing email or password' 
      }, { status: 400 });
    }

    // Check if it's our test customer
    if (email === 'customer@test.com' && password === 'TestPassword123!') {
      // Generate JWT token for customer
      const token = jwt.sign(
        { 
          customerId: 'dev-customer-123',
          tenantId: 'EP7BbCWm0JFvhjwBtcEs',
          email: 'customer@test.com',
          type: 'customer'
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );

      // Create a redirect response with cookies
      const redirectUrl = '/demo-store/account';
      const response = NextResponse.redirect(new URL(redirectUrl, req.url));

      // Set the necessary cookies for customer session
      response.cookies.set('customer_token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('customer_id', 'dev-customer-123', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        path: '/', 
        maxAge: 60 * 60 * 24 * 7 
      });
      response.cookies.set('customer_email', 'customer@test.com', { 
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

    return NextResponse.json({ 
      ok: false, 
      error: 'Invalid credentials' 
    }, { status: 401 });

  } catch (error: any) {
    console.error('Customer auth bypass error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Authentication failed'
    }, { status: 500 });
  }
}
