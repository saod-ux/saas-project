import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true, // Skip email verification for testing
    });

    return NextResponse.json({
      ok: true,
      message: 'User created successfully',
      uid: userRecord.uid,
      email: userRecord.email,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({
        ok: false,
        error: 'User with this email already exists',
        code: 'EMAIL_EXISTS'
      }, { status: 409 });
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json({
        ok: false,
        error: 'Password is too weak',
        code: 'WEAK_PASSWORD'
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to create user',
      code: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 });
  }
}
