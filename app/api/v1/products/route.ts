import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant'
import { requireMembership, requireRole } from '@/lib/auth'
import { prismaRO, prismaRW } from '@/lib/db'
import { createProductSchema, productQuerySchema } from '@/lib/validations'

enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER'
}

// GET /api/v1/products - List products (requires VIEWER role)
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
    
    // Get user and check membership
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
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Active membership required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const query = productQuerySchema.parse(Object.fromEntries(searchParams))
    
    // Build where clause with tenant filter
    const where: any = {
      tenantId: tenant.id
    }
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ]
    }
    if (query.status) {
      where.status = query.status
    }
    
    // Pagination
    const page = query.page || 1
    const limit = query.limit || 20
    const skip = (page - 1) * limit
    
    const [products, total] = await Promise.all([
      prismaRO.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          productImages: {
            orderBy: { order: 'asc' },
            take: 1, // Just get the first image for the list
          },
        },
      }),
      prismaRO.product.count({ where }),
    ])
    
    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }
    
    if (error.message?.includes('required')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/products - Create product (requires STAFF role)
export async function POST(request: NextRequest) {
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
    
    // Get user and check membership
    const { auth } = await import('@clerk/nextjs/server')
    const clerkAuth = await auth()
    
    if (!clerkAuth.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const user = await prismaRW.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }
    
    const membership = await prismaRW.membership.findFirst({
      where: {
        userId: user.id,
        tenantId: tenant.id,
        status: 'ACTIVE'
      }
    })
    
    if (!membership) {
      return NextResponse.json(
        { error: 'Active membership required' },
        { status: 403 }
      )
    }
    
    // Check if user has STAFF or higher role
    const roleHierarchy = {
      'OWNER': 4,
      'ADMIN': 3,
      'STAFF': 2,
      'VIEWER': 1
    }
    
    if (roleHierarchy[membership.role as keyof typeof roleHierarchy] < roleHierarchy['STAFF']) {
      return NextResponse.json(
        { error: 'STAFF role required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)
    
    const product = await prismaRW.product.create({
      data: {
        ...validatedData,
        tenantId: tenant.id,
      },
      include: {
        productImages: true,
      },
    })
    
    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }
    
    if (error.message?.includes('required')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
