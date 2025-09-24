import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCart, clearCart, CheckoutSchema } from '@/lib/cart'
import { getTenantBySlug } from '@/lib/firebase/tenant'
import { findOrCreateTenantUser } from '@/lib/tenant-user'
import { getCustomerWithSession } from '@/lib/customer-auth'
import { getTenantDocuments, createDocument } from '@/lib/db'

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

    // Check for authenticated customer
    const authenticatedCustomer = await getCustomerWithSession(request, tenant.id)
    
    // Parse and validate request body
    const body = await request.json()
    const { name, email, phone } = CheckoutSchema.parse(body)

    // Get cart
    const cart = await getCart(tenantSlug)
    if (cart.items.length === 0) {
      return NextResponse.json({ ok: false, error: 'CART_EMPTY' }, { status: 400 })
    }

    // Re-validate products and calculate totals
    const validatedItems = []
    let subtotal = 0

    for (const cartItem of cart.items) {
      // Get products from Firestore
      const products = await getTenantDocuments('products', tenant.id)
      const product = products.find((p: any) => 
        p.id === cartItem.productId && p.status === 'active'
      )

      if (!product) {
        return NextResponse.json({ 
          ok: false, 
          error: 'PRODUCT_NOT_FOUND',
          productId: cartItem.productId 
        }, { status: 400 })
      }

      // Use current price for validation, but keep snapshot for order
      const currentPrice = Number(product.price)
      const itemTotal = currentPrice * cartItem.qty
      
      validatedItems.push({
        productId: product.id,
        nameSnapshot: product.title,
        priceSnapshot: currentPrice,
        quantity: cartItem.qty,
        total: itemTotal
      })

      subtotal += itemTotal
    }

    // Use authenticated customer or create/find guest customer
    let tenantUser
    if (authenticatedCustomer) {
      tenantUser = authenticatedCustomer
    } else {
      tenantUser = await findOrCreateTenantUser(tenant.id, email, {
        name,
        phone,
        isGuest: true
      })

      if (!tenantUser) {
        return NextResponse.json({ 
          ok: false, 
          error: 'FAILED_TO_CREATE_CUSTOMER' 
        }, { status: 500 })
      }
    }

    // Create order
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    const orderData = {
      tenantId: tenant.id,
      tenantUserId: tenantUser.id,
      orderNumber,
      status: 'PENDING',
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      subtotal: subtotal,
      tax: 0, // No tax for MVP
      shipping: 0, // No shipping for MVP
      total: subtotal,
      currency: 'KWD',
      orderItems: validatedItems.map(item => ({
        productId: item.productId,
        nameSnapshot: item.nameSnapshot,
        priceSnapshot: item.priceSnapshot,
        quantity: item.quantity,
        total: item.total
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const order = await createDocument('orders', orderData)

    // Clear cart
    await clearCart()

    return NextResponse.json({
      ok: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency
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

    console.error('Checkout error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR' 
    }, { status: 500 })
  }
}
