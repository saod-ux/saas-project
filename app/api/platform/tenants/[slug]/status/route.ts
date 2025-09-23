import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaRW } from '@/lib/db'
import { requirePlatformRole } from '@/lib/auth'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  reason: z.string().optional(),
  notes: z.string().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Require platform admin role
    const gate = await requirePlatformRole(request, "SUPER_ADMIN")
    if (gate instanceof NextResponse) return gate
    const { userId } = gate
    
    const { slug } = params
    const body = await request.json()
    
    // Validate request body
    const validatedData = updateStatusSchema.parse(body)
    
    // Check if tenant exists
    const existingTenant = await prismaRW.tenant.findUnique({
      where: { slug },
      select: { 
        id: true, 
        name: true, 
        status: true,
        memberships: {
          select: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Prevent downgrading from ARCHIVED
    if (existingTenant.status === 'ARCHIVED' && validatedData.status !== 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Cannot change status of archived tenant. Contact support to restore.' },
        { status: 400 }
      )
    }

    // Update tenant status
    const updatedTenant = await prismaRW.tenant.update({
      where: { slug },
      data: { 
        status: validatedData.status,
        updatedAt: new Date()
      },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        updatedAt: true
      }
    })

    // Log the status change
    await prismaRW.auditLog.create({
      data: {
        tenantId: existingTenant.id,
        actorUserId: userId,
        action: 'TENANT_STATUS_CHANGED',
        targetType: 'TENANT',
        targetId: existingTenant.id,
        meta: {
          oldStatus: existingTenant.status,
          newStatus: validatedData.status,
          reason: validatedData.reason,
          notes: validatedData.notes,
          changedBy: userId
        }
      }
    })

    // If suspending, notify tenant members
    if (validatedData.status === 'SUSPENDED') {
      // TODO: Send notification emails to tenant members
      console.log(`Tenant ${slug} suspended. Notifying ${existingTenant.memberships.length} members.`)
    }

    return NextResponse.json({
      ok: true,
      data: updatedTenant,
      message: `Tenant status updated to ${validatedData.status}`
    })

  } catch (error) {
    console.error('Error updating tenant status:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Require platform admin role
    const gate = await requirePlatformRole(request, "SUPER_ADMIN")
    if (gate instanceof NextResponse) return gate
    const { userId } = gate
    
    const { slug } = params

    const tenant = await prismaRW.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            user: {
              select: {
                email: true,
                name: true
              }
            },
            role: true,
            status: true
          }
        },
        _count: {
          select: {
            products: true,
            orders: true,
            memberships: true
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: tenant
    })

  } catch (error) {
    console.error('Error fetching tenant status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

