import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { removeFromCart, CartRemoveSchema } from '@/lib/cart'
import { resolveTenantBySlug } from '@/lib/tenant'
import { ok, notFound, badRequest, errorResponse } from '@/lib/http/responses'

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
      return notFound('TENANT_NOT_FOUND')
    }

    // Parse and validate request body
    const body = await request.json()
    const { productId } = CartRemoveSchema.parse(body)

    // Remove from cart
    const cart = await removeFromCart(tenantSlug, productId)

    return ok({
      cart,
      itemCount: cart.items.reduce((total, item) => total + item.qty, 0)
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('VALIDATION_ERROR', { details: error.errors })
    }

    console.error('Cart remove error:', error)
    return errorResponse('INTERNAL_ERROR')
  }
}
