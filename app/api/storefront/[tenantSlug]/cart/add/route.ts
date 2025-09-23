import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { addToCart, CartAddSchema } from '@/lib/cart'
import { resolveTenantBySlug } from '@/lib/tenant'
import { findOrCreateTenantUser } from '@/lib/tenant-user'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = params

    // Get tenant
    const tenant = await resolveTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'TENANT_NOT_FOUND' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { productId, qty } = CartAddSchema.parse(body)

    // Fetch product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        tenantId: tenant.id,
        status: 'active'
      },
      select: {
        id: true,
        title: true,
        price: true
      }
    })

    if (!product) {
      return NextResponse.json({ ok: false, error: 'PRODUCT_NOT_FOUND' }, { status: 404 })
    }

    // Add to cart
    const cart = await addToCart(
      tenantSlug,
      productId,
      product.title,
      Number(product.price),
      qty
    )

    return NextResponse.json({
      ok: true,
      data: {
        cart,
        itemCount: cart.items.reduce((total, item) => total + item.qty, 0)
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: 'VALIDATION_ERROR',
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Cart add error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR' 
    }, { status: 500 })
  }
}
