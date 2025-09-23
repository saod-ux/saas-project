import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/auth-server';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({
        ok: false,
        error: 'ID token is required'
      }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyIdToken(idToken);

    if (!decodedToken) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid token'
      }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Token verified successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        email_verified: decodedToken.email_verified
      }
    });
  } catch (error: any) {
    console.error('Token verification failed:', error);
    return NextResponse.json({
      ok: false,
      error: 'Token verification failed',
      details: error.message
    }, { status: 500 });
  }
}

