import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// GET /api/v1/test-simple - Simple auth test
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    return NextResponse.json({
      success: true,
      user: user,
      authenticated: !!user
    })
    
  } catch (error: any) {
    console.error('Simple auth test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
