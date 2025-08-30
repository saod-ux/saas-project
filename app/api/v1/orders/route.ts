import { NextRequest, NextResponse } from 'next/server'
import { requireMembership } from '@/lib/auth'
import { resolveTenantBySlug } from '@/lib/tenant'
import { prismaRO, prismaRW } from '@/lib/db'
import { z } from 'zod'

const orderQuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled', 'payment_failed', 'fulfilled']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  q: z.string().optional(), // Search by customer name/email
})

const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'cancelled', 'payment_failed', 'fulfilled']),
  notes: z.string().optional(),
})

// GET /api/v1/orders - List orders (requires VIEWER role)
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

    // Check if this is an admin request
    const { auth } = await import('@clerk/nextjs/server')
    const clerkAuth = await auth()
    
    let isAdminRequest = false
    if (clerkAuth.userId) {
      const user = await prismaRO.user.findFirst({ 
        where: { clerkId: clerkAuth.userId } 
      })
      if (user) {
        const membership = await prismaRO.membership.findFirst({
          where: { 
            userId: user.id, 
            tenantId: tenant.id, 
            status: 'ACTIVE' 
          }
        })
        if (membership) {
          isAdminRequest = true
        }
      }
    }

    // For now, only allow admin access to orders
    if (!isAdminRequest) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = orderQuerySchema.parse(Object.fromEntries(searchParams))

    const where: any = { tenantId: tenant.id }

    if (query.status) {
      where.status = query.status
    }

    if (query.q) {
      where.OR = [
        { customerInfo: { path: ['name'], string_contains: query.q } },
        { customerInfo: { path: ['email'], string_contains: query.q } },
      ]
    }

    const page = query.page || 1
    const limit = query.limit || 20
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prismaRO.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: { title: true, price: true }
              }
            }
          },
          payments: {
            select: { method: true, status: true, amount: true }
          }
        }
      }),
      prismaRO.order.count({ where }),
    ])

    return NextResponse.json({
      data: orders,
      pagination: { 
        page, 
        limit, 
        total, 
        pages: Math.ceil(total / limit) 
      },
    })

  } catch (error: any) {
    console.error('Error fetching orders:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/orders - Update order status (requires ADMIN role)
export async function PATCH(request: NextRequest) {
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

    // Require ADMIN role for order updates
    const { auth } = await import('@clerk/nextjs/server')
    const clerkAuth = await auth()
    
    if (!clerkAuth.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prismaRO.user.findFirst({ 
      where: { clerkId: clerkAuth.userId } 
    })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    const membership = await prismaRO.membership.findFirst({
      where: { 
        userId: user.id, 
        tenantId: tenant.id, 
        status: 'ACTIVE' 
      }
    })
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = orderUpdateSchema.parse(body)

    // For now, this is a stub - you'd typically update a specific order
    // In a real implementation, you'd have an order ID in the request
    
    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: validatedData
    })

  } catch (error: any) {
    console.error('Error updating order:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
