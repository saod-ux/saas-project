export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug, getTenantDocuments } from '@/lib/firebase/tenant'
import { requireRole } from '@/lib/auth'

enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER'
}

// GET /api/v1/members - List team members (requires VIEWER role)
export async function GET(request: NextRequest) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }
    
    const tenant = await getTenantBySlug(tenantSlug)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Require VIEWER role to list members
    await requireRole(tenant.id, UserRole.VIEWER)
    
    const allMemberships = await getTenantDocuments('memberships', tenant.id)
    const allUsers = await getTenantDocuments('users', '')
    
    const members = allMemberships
      .map((membership: any) => {
        const user = allUsers.find((u: any) => u.id === membership.userId)
        return {
          ...membership,
          user: user ? {
            id: user.id,
            email: user.email,
            name: user.name
          } : null
        }
      })
      .filter((m: any) => m.user !== null)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    return NextResponse.json({
      data: members
    })
  } catch (error: any) {
    if (error.message?.includes('required')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
