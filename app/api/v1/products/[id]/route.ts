import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant'
import { getTenantPrisma } from '@/lib/db'
import { updateProductSchema } from '@/lib/validations'

// GET /api/v1/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : await resolveTenant(host)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    const tenantPrisma = getTenantPrisma(tenant.id)
    
    const product = await tenantPrisma.product.findUnique({
      where: { id: params.id },
      include: {
        productImages: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/products/[id] - Update product
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : await resolveTenant(host)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)
    
    const tenantPrisma = getTenantPrisma(tenant.id)
    
    // Check if product exists
    const existingProduct = await tenantPrisma.product.findUnique({
      where: { id: params.id },
    })
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    const product = await tenantPrisma.product.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        productImages: {
          orderBy: { order: 'asc' },
        },
      },
    })
    
    return NextResponse.json({ data: product })
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : await resolveTenant(host)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    const tenantPrisma = getTenantPrisma(tenant.id)
    
    // Check if product exists
    const existingProduct = await tenantPrisma.product.findUnique({
      where: { id: params.id },
    })
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    await tenantPrisma.product.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
