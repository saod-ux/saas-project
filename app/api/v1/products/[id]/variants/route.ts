import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createVariantSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  weight: z.number().positive().optional(),
  optionValues: z.array(z.string().min(1)).min(1) // Array of option value IDs
})

const updateVariantSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  weight: z.number().positive().optional()
})

// GET /api/v1/products/[id]/variants - Get product variants
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

    // Get product variants with their options
    const variants = await import('@/lib/db').then(db => db.prismaRO.productVariant.findMany({
      where: {
        productId: params.id,
        product: {
          tenantId: tenant.id
        }
      },
      include: {
        variantOptions: {
          include: {
            productOptionValue: {
              include: {
                productOption: true
              }
            }
          }
        },
        variantImages: {
          include: {
            file: true
          },
          orderBy: { order: 'asc' }
        }
      }
    }))

    return NextResponse.json({
      data: variants.map(variant => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        weight: variant.weight,
        options: variant.variantOptions.map(vo => ({
          optionName: vo.productOptionValue.productOption.name,
          optionValue: vo.productOptionValue.value
        })),
        images: variant.variantImages.map(img => ({
          id: img.id,
          key: img.file.key,
          alt: img.alt,
          order: img.order
        }))
      }))
    })

  } catch (error: any) {
    console.error('Error getting product variants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/products/[id]/variants - Create product variant
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
    const validatedData = createVariantSchema.parse(body)

    // Verify all option values exist and belong to this product
    const optionValues = await import('@/lib/db').then(db => db.prismaRO.productOptionValue.findMany({
      where: {
        id: { in: validatedData.optionValues },
        productOption: {
          productId: params.id
        }
      }
    }))

    if (optionValues.length !== validatedData.optionValues.length) {
      return NextResponse.json(
        { error: 'Invalid option values' },
        { status: 400 }
      )
    }

    // Check if variant with same options already exists
    const existingVariant = await import('@/lib/db').then(db => db.prismaRO.productVariant.findFirst({
      where: {
        productId: params.id,
        variantOptions: {
          every: {
            productOptionValueId: { in: validatedData.optionValues }
          }
        }
      }
    }))

    if (existingVariant) {
      return NextResponse.json(
        { error: 'Variant with these options already exists' },
        { status: 409 }
      )
    }

    // Create variant with options
    const variant = await import('@/lib/db').then(db => db.prismaRW.productVariant.create({
      data: {
        productId: params.id,
        sku: validatedData.sku,
        price: validatedData.price,
        stock: validatedData.stock,
        weight: validatedData.weight,
        variantOptions: {
          create: validatedData.optionValues.map(optionValueId => ({
            productOptionValueId
          }))
        }
      },
      include: {
        variantOptions: {
          include: {
            productOptionValue: {
              include: {
                productOption: true
              }
            }
          }
        }
      }
    }))

    return NextResponse.json({
      data: {
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        weight: variant.weight,
        options: variant.variantOptions.map(vo => ({
          optionName: vo.productOptionValue.productOption.name,
          optionValue: vo.productOptionValue.value
        }))
      },
      message: 'Product variant created'
    }, { status: 201 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }

    console.error('Error creating product variant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
