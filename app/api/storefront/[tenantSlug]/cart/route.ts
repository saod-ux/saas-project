import { NextRequest, NextResponse } from 'next/server'
import { getCart, calculateSubtotal } from '@/lib/cart'
import { resolveTenantBySlug } from '@/lib/tenant'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
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

    // Get cart
    const cart = await getCart(tenantSlug)
    const subtotal = calculateSubtotal(cart)

    return NextResponse.json({
      ok: true,
      data: {
        items: cart.items,
        subtotal,
        itemCount: cart.items.reduce((total, item) => total + item.qty, 0)
      }
    })

  } catch (error) {
    console.error('Cart get error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR' 
    }, { status: 500 })
  }
}
