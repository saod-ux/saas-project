import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test Firebase Admin SDK directly
    console.log('Testing Firebase Admin SDK...');
    
    // Check environment variables
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    
    console.log('Environment variables:', {
      hasProjectId,
      hasClientEmail,
      hasPrivateKey,
      projectId: process.env.FIREBASE_PROJECT_ID?.substring(0, 10) + '...'
    });
    
    if (!hasProjectId || !hasClientEmail || !hasPrivateKey) {
      return NextResponse.json({
        ok: false,
        error: 'Missing Firebase environment variables',
        details: {
          hasProjectId,
          hasClientEmail,
          hasPrivateKey
        }
      }, { status: 500 });
    }
    
    // Try to initialize Firebase Admin
    const firebaseAdmin = await import('firebase-admin/app');
    const firestoreAdmin = await import('firebase-admin/firestore');
    
    const { initializeApp, getApps, cert } = firebaseAdmin;
    const { getFirestore } = firestoreAdmin;
    
    const app = getApps().length === 0 ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    }) : getApps()[0];
    
    const db = getFirestore(app);
    
    // Test Firestore connection
    const testCollection = db.collection('test');
    const testDoc = await testCollection.add({
      message: 'Test document',
      timestamp: new Date()
    });
    
    return NextResponse.json({
      ok: true,
      message: 'Firebase Admin SDK test successful',
      testDocId: testDoc.id,
      environment: {
        hasProjectId,
        hasClientEmail,
        hasPrivateKey
      }
    });
  } catch (error) {
    console.error('Firebase Admin test error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Firebase Admin SDK test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
