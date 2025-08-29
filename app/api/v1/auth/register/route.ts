import { NextRequest, NextResponse } from 'next/server'
import { prismaRW } from '@/lib/db'
import { resolveTenantBySlug } from '@/lib/tenant'

// POST /api/v1/auth/register - Register user and create membership
export async function POST(request: NextRequest) {
  try {
    // Get the Clerk token from the Authorization header
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

    // Use raw SQL to avoid Prisma type issues
    const result = await prismaRW.$transaction(async (tx) => {
      // Check if user already exists
      const existingUser = await tx.$queryRaw`
        SELECT id, email, name FROM users WHERE "clerkId" = ${userId}
      ` as any[]

      let user
      if (existingUser.length > 0) {
        user = existingUser[0]
      } else {
        // Create new user
        const newUser = await tx.$queryRaw`
          INSERT INTO users (id, email, name, "clerkId", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${email || `user-${userId}@example.com`}, ${name || 'New User'}, ${userId}, NOW(), NOW())
          RETURNING id, email, name
        ` as any[]
        user = newUser[0]
      }

      // Check if membership already exists
      const existingMembership = await tx.$queryRaw`
        SELECT id FROM memberships WHERE "tenantId" = ${tenant.id} AND "userId" = ${user.id}
      ` as any[]

      if (existingMembership.length > 0) {
        throw new Error('User already has membership in this tenant')
      }

      // Create membership with OWNER role
      const membership = await tx.$queryRaw`
        INSERT INTO memberships (id, "tenantId", "userId", role, status, "acceptedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${tenant.id}, ${user.id}, 'OWNER', 'ACTIVE', NOW(), NOW(), NOW())
        RETURNING id, role, status
      ` as any[]

      return { user, membership: membership[0] }
    })

    return NextResponse.json({
      data: {
        user: result.user,
        membership: result.membership
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
