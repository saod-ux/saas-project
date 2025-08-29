import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant'
import { requireRole } from '@/lib/auth'
import { prismaRO } from '@/lib/db'

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
    
    const tenant = await resolveTenantBySlug(tenantSlug)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Require VIEWER role to list members
    await requireRole(tenant.id, UserRole.VIEWER)
    
    const members = await prismaRO.membership.findMany({
      where: {
        tenantId: tenant.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    
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
