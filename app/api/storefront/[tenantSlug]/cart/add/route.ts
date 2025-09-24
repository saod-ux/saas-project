import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTenantBySlug, getTenantDocuments } from '@/lib/firebase/tenant'
import { addToCart, CartAddSchema } from '@/lib/cart'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = params

    // Get tenant
    const tenant = await getTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'TENANT_NOT_FOUND' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { productId, qty } = CartAddSchema.parse(body)

    // Fetch product
    const allProducts = await getTenantDocuments('products', tenant.id)
    const product = allProducts.find((p: any) => 
      p.id === productId && p.status === 'active'
    )

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
