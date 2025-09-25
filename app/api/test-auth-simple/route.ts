import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('Auth test request:', { email, password: password ? '***' : 'missing' });
    
    // Test Firebase Admin SDK
    const firebaseAdmin = await import('firebase-admin/app');
    const { getApps, initializeApp, cert } = firebaseAdmin;
    
    // Check if Firebase Admin is initialized
    if (getApps().length === 0) {
      const { projectId, clientEmail, privateKey } = {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      };
      
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }
    
    return NextResponse.json({
      ok: true,
      message: 'Auth test successful',
      hasEmail: !!email,
      hasPassword: !!password,
      firebaseInitialized: getApps().length > 0,
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
