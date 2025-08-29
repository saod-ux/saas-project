import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUser, getCurrentMembership } from '@/lib/auth'

// GET /api/v1/test-auth - Test authentication
export async function GET(request: NextRequest) {
  try {
    console.log('=== Testing Authentication ===')
    
    // Get Clerk auth
    const clerkAuth = await auth()
    console.log('Clerk auth:', { userId: clerkAuth.userId, sessionId: clerkAuth.sessionId })
    
    // Get current user
    const user = await getCurrentUser()
    console.log('Current user:', user)
    
    // Get tenant slug
    const tenantSlug = request.headers.get('x-tenant-slug')
    console.log('Tenant slug:', tenantSlug)
    
    // Get membership if tenant provided
    let membership = null
    if (tenantSlug) {
      // Import tenant resolver
      const { resolveTenantBySlug } = await import('@/lib/tenant')
      const tenant = await resolveTenantBySlug(tenantSlug)
      console.log('Tenant:', tenant)
      
      if (tenant && user) {
        membership = await getCurrentMembership(tenant.id)
        console.log('Membership:', membership)
      }
    }
    
    return NextResponse.json({
      clerkAuth: { userId: clerkAuth.userId, sessionId: clerkAuth.sessionId },
      user,
      tenantSlug,
      membership
    })
    
  } catch (error: any) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
