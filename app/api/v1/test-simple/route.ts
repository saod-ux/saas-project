import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// GET /api/v1/test-simple - Simple auth test
export async function GET(request: NextRequest) {
  try {
    const clerkAuth = await auth()
    
    return NextResponse.json({
      success: true,
      clerkAuth: {
        userId: clerkAuth.userId,
        sessionId: clerkAuth.sessionId,
        actor: clerkAuth.actor,
        sessionClaims: clerkAuth.sessionClaims
      },
      headers: {
        host: request.headers.get('host'),
        'x-tenant-slug': request.headers.get('x-tenant-slug')
      }
    })
    
  } catch (error: any) {
    console.error('Simple auth test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
