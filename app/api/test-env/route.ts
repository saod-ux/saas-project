import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Server-side environment variables (only accessible on server)
    const serverEnvs = {
      env: "server",
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID 
        ? `SET:${process.env.FIREBASE_PROJECT_ID}` 
        : "MISSING",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL 
        ? `SET:${process.env.FIREBASE_CLIENT_EMAIL.replace(/(.{3}).*(@.*)/, '$1***$2')}` 
        : "MISSING",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY 
        ? `SET:length=${process.env.FIREBASE_PRIVATE_KEY.length}` 
        : "MISSING",
    };

    // Note: NEXT_PUBLIC_* variables should NOT be read on server side
    // They are only available on client side

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      serverEnvs,
    });
  } catch (error) {
    console.error('Server env test error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}