import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';
import { createCustomClaims } from '@/lib/auth-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false, error: 'Not allowed in production' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ 
      ok: false, 
      error: 'Missing email or password' 
    }, { status: 400 });
  }

  try {
    console.log('Creating test admin user:', email);

    // Create user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: 'Test Admin',
      emailVerified: true
    });

    console.log('User created:', userRecord.uid);

    // Set custom claims for merchant admin
    const customClaims = createCustomClaims('merchant_admin', 'admin', 'EP7BbCWm0JFvhjwBtcEs', 'demo-store');
    await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);

    console.log('Custom claims set:', customClaims);

    return NextResponse.json({ 
      ok: true, 
      message: 'Test admin user created successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        userType: 'merchant_admin',
        role: 'admin',
        tenantSlug: 'demo-store'
      }
    });

  } catch (error: any) {
    console.error('Error creating test admin:', error);
    
    if (error.code === 'auth/email-already-exists') {
      // User exists, just update claims
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        const customClaims = createCustomClaims('merchant_admin', 'admin', 'EP7BbCWm0JFvhjwBtcEs', 'demo-store');
        await adminAuth.setCustomUserClaims(userRecord.uid, customClaims);
        
        return NextResponse.json({ 
          ok: true, 
          message: 'Test admin user updated successfully',
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            userType: 'merchant_admin',
            role: 'admin',
            tenantSlug: 'demo-store'
          }
        });
      } catch (updateError) {
        console.error('Error updating user claims:', updateError);
        return NextResponse.json({ 
          ok: false, 
          error: 'Failed to update user claims',
          details: updateError.message 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      ok: false, 
      error: error.message || 'Failed to create test admin',
      code: error.code 
    }, { status: 500 });
  }
}
