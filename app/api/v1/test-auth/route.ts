import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// GET /api/v1/test-auth - Test authentication
export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing Authentication ===')
    
    // Get Firebase user
    const user = await getCurrentUser()
    console.log('Firebase user:', user)
    
    // Get tenant slug
    const tenantSlug = request.headers.get('x-tenant-slug')
    console.log('Tenant slug:', tenantSlug)
    
    return NextResponse.json({
      user,
      tenantSlug,
      authenticated: !!user
    })
    
  } catch (error: any) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
