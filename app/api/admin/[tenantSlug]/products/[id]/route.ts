import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaRW } from '@/lib/db'
import { requireTenantAndRole } from '@/lib/rbac'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.number().min(0),
  currency: z.enum(['KWD', 'USD']).default('KWD'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isOnOffer: z.boolean().default(false),
  featured: z.boolean().default(false),
  stockQuantity: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).optional(),
  primaryCategoryId: z.string().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'EDITOR'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    const product = await prismaRW.product.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        currency: true,
        status: true,
        isBestSeller: true,
        isNewArrival: true,
        isOnOffer: true,
        featured: true,
        stock: true,
        lowStockThreshold: true,
        primaryCategoryId: true,
        imageUrl: true,
        gallery: true,
        productImages: {
          select: {
            id: true,
            url: true,
            isPrimary: true
          }
        },
        primaryCategory: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: product
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'EDITOR'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    const body = await request.json()
    console.log('Received product update data:', body) // Debug log
    const validatedData = updateProductSchema.parse(body)
    console.log('Validated product data:', validatedData) // Debug log
    
    // Check if product exists and belongs to tenant
    const existingProduct = await prismaRW.product.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Update product
    const updatedProduct = await prismaRW.product.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        currency: validatedData.currency,
        status: validatedData.status,
        isBestSeller: validatedData.isBestSeller,
        isNewArrival: validatedData.isNewArrival,
        isOnOffer: validatedData.isOnOffer,
        featured: validatedData.featured,
        stock: validatedData.stockQuantity,
        lowStockThreshold: validatedData.lowStockThreshold,
        primaryCategoryId: validatedData.primaryCategoryId || null,
        imageUrl: validatedData.imageUrl || null,
        gallery: validatedData.images || [],
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      ok: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('Error updating product:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    // Check if product exists and belongs to tenant
    const existingProduct = await prismaRW.product.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete product (cascade will handle related records)
    await prismaRW.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      ok: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}