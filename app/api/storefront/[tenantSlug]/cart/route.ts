import { NextRequest, NextResponse } from 'next/server'
import { getCart, calculateSubtotal } from '@/lib/cart'
import { resolveTenantBySlug } from '@/lib/tenant'
import { ok, notFound, errorResponse } from '@/lib/http/responses'

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
      return notFound('TENANT_NOT_FOUND')
    }

    // Get cart
    const cart = await getCart(tenantSlug)
    const subtotal = calculateSubtotal(cart)

    return ok({
      items: cart.items,
      subtotal,
      itemCount: cart.items.reduce((total, item) => total + item.qty, 0)
    })

  } catch (error) {
    console.error('Cart get error:', error)
    return errorResponse('INTERNAL_ERROR')
  }
}
