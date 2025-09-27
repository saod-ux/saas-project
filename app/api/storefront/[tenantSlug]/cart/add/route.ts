import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getTenantDocuments } from '@/lib/firebase/tenant'
import { getTenantBySlug } from '@/lib/services/tenant'
import { addToCart, CartAddSchema } from '@/lib/cart'
import { ok, notFound, badRequest, errorResponse } from '@/lib/http/responses'
import { validateBusinessRule, BusinessRules } from '@/lib/business-rules'

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
      return notFound('TENANT_NOT_FOUND')
    }

    // Parse and validate request body
    const body = await request.json()
    const { productId, qty } = CartAddSchema.parse(body)

    // Apply business rules validation
    const businessRuleResult = await validateBusinessRule(
      BusinessRules.Cart.validateCartItem,
      { productId, quantity: qty },
      { tenantId: tenant.id }
    );
    
    if (!businessRuleResult.success) {
      return businessRuleResult.response;
    }

    // Fetch product
    const allProducts = await getTenantDocuments('products', tenant.id)
    const product = allProducts.find((p: any) => 
      p.id === productId && p.status === 'active'
    )

    if (!product) {
      return notFound('PRODUCT_NOT_FOUND')
    }

    // Add to cart
    const cart = await addToCart(
      tenantSlug,
      productId,
      product.title,
      Number(product.price),
      qty
    )

    return ok({
      cart,
      itemCount: cart.items.reduce((total, item) => total + item.qty, 0)
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest('VALIDATION_ERROR', { details: error.errors })
    }

    console.error('Cart add error:', error)
    return errorResponse('INTERNAL_ERROR')
  }
}
