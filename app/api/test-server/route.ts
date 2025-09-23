import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ok: true,
    message: 'Server-side API test successful',
    isServer: typeof window === 'undefined',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      ok: true,
      message: 'Server-side POST test successful',
      isServer: typeof window === 'undefined',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'Failed to parse JSON',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}

