import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant'
import { createTenantUser, createMembership } from '@/lib/firebase/tenant'

// POST /api/v1/auth/register - Register user and create membership
export async function POST(request: NextRequest) {
  try {
    // Get the Firebase token from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    // For now, we'll use the token as the userId (this is a simplified approach)
    const userId = token

    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }

    const tenant = await resolveTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { email, name } = body

    // Create user in Firestore
    const user = await createTenantUser(tenant.id, {
      id: userId,
      email: email || `user-${userId}@example.com`,
      name: name || 'New User',
      firebaseUid: userId,
    })

    // Create membership with OWNER role
    const membership = await createMembership(tenant.id, {
      id: `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      role: 'OWNER',
      status: 'ACTIVE',
      acceptedAt: new Date(),
    })

    return NextResponse.json({
      data: {
        user: user,
        membership: membership
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error registering user:', error)
    
    if (error.message?.includes('already has membership')) {
      return NextResponse.json(
        { error: 'User already has membership in this tenant' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
