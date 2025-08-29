import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createOptionSchema = z.object({
  name: z.string().min(1).max(50),
  required: z.boolean().default(true),
  order: z.number().int().min(0).default(0),
  values: z.array(z.object({
    value: z.string().min(1).max(50),
    order: z.number().int().min(0).default(0)
  })).min(1)
})

const updateOptionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  required: z.boolean().optional(),
  order: z.number().int().min(0).optional()
})

// GET /api/v1/products/[id]/options - Get product options
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }

    // Get tenant
    const { resolveTenantBySlug } = await import('@/lib/tenant')
    const tenant = await resolveTenantBySlug(tenantSlug)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get product options with values
    const options = await import('@/lib/db').then(db => db.prismaRO.productOption.findMany({
      where: {
        productId: params.id,
        product: {
          tenantId: tenant.id
        }
      },
      include: {
        optionValues: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    }))

    return NextResponse.json({
      data: options.map(option => ({
        id: option.id,
        name: option.name,
        required: option.required,
        order: option.order,
        values: option.optionValues.map(value => ({
          id: value.id,
          value: value.value,
          order: value.order
        }))
      }))
    })

  } catch (error: any) {
    console.error('Error getting product options:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/products/[id]/options - Create product option
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }

    // Get tenant
    const { resolveTenantBySlug } = await import('@/lib/tenant')
    const tenant = await resolveTenantBySlug(tenantSlug)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get user
    const { auth } = await import('@clerk/nextjs/server')
    const clerkAuth = await auth()
    
    if (!clerkAuth.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const user = await import('@/lib/db').then(db => db.prismaRW.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    }))
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Verify product exists and user has access
    const product = await import('@/lib/db').then(db => db.prismaRO.product.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    }))

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = createOptionSchema.parse(body)

    // Create option with values
    const option = await import('@/lib/db').then(db => db.prismaRW.productOption.create({
      data: {
        productId: params.id,
        name: validatedData.name,
        required: validatedData.required,
        order: validatedData.order,
        optionValues: {
          create: validatedData.values.map(value => ({
            value: value.value,
            order: value.order
          }))
        }
      },
      include: {
        optionValues: {
          orderBy: { order: 'asc' }
        }
      }
    }))

    // Update product to indicate it has variants
    await import('@/lib/db').then(db => db.prismaRW.product.update({
      where: { id: params.id },
      data: { hasVariants: true }
    }))

    return NextResponse.json({
      data: {
        id: option.id,
        name: option.name,
        required: option.required,
        order: option.order,
        values: option.optionValues.map(value => ({
          id: value.id,
          value: value.value,
          order: value.order
        }))
      },
      message: 'Product option created'
    }, { status: 201 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }

    console.error('Error creating product option:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
