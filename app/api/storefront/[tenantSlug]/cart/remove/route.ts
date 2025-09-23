import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { removeFromCart, CartRemoveSchema } from '@/lib/cart'
import { resolveTenantBySlug } from '@/lib/tenant'

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
    const { productId } = CartRemoveSchema.parse(body)

    // Remove from cart
    const cart = await removeFromCart(tenantSlug, productId)

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

    console.error('Cart remove error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR' 
    }, { status: 500 })
  }
}
