import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant'
import { requireRole } from '@/lib/auth'
import { prismaRW } from '@/lib/db'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole).default(UserRole.VIEWER)
})

// POST /api/v1/invites - Create invitation
export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? 
      await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : 
      await resolveTenant(host)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Require ADMIN or higher to create invites
    const membership = await requireRole(tenant.id, UserRole.ADMIN)
    
    const body = await request.json()
    const validatedData = createInviteSchema.parse(body)

    // Check if user already has membership
    const existingUser = await prismaRW.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      const existingMembership = await prismaRW.membership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: existingUser.id
          }
        }
      })

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User already has membership in this tenant' },
          { status: 409 }
        )
      }
    }

    // Create or find user
    let user = existingUser
    if (!user) {
      user = await prismaRW.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.email.split('@')[0] // Basic name from email
        }
      })
    }

    // Create invitation
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const invite = await prismaRW.invite.create({
      data: {
        tenantId: tenant.id,
        email: validatedData.email,
        role: validatedData.role,
        invitedBy: membership.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        accepted: false
      }
    })

    // In development, log the accept URL
    if (process.env.NODE_ENV === 'development') {
      const acceptUrl = `${request.nextUrl.origin}/accept-invite?token=${token}`
      console.log(`Invitation created for ${validatedData.email} in ${tenant.slug}:`)
      console.log(`Accept URL: ${acceptUrl}`)
    }

    return NextResponse.json({ 
      data: invite,
      message: 'Invitation created successfully'
    }, { status: 201 })

  } catch (error: any) {
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create invitations' },
        { status: 403 }
      )
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }

    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/v1/invites - List invitations
export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? 
      await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : 
      await resolveTenant(host)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Require ADMIN or higher to view invites
    await requireRole(tenant.id, UserRole.ADMIN)
    
    const invites = await prismaRW.invite.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        inviter: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({ data: invites })

  } catch (error: any) {
    if (error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions to view invitations' },
        { status: 403 }
      )
    }

    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
