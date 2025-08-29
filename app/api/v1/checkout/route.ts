import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional()
  }),
  shipping: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1)
  }),
  paymentProvider: z.enum(['MYFATOORAH', 'KNET', 'STRIPE']),
  notes: z.string().optional()
})

// POST /api/v1/checkout - Create order and initiate payment
export async function POST(request: NextRequest) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }

    // Get tenant
    const { resolveTenantBySlug } = await import('@/lib/tenant')
    const tenant = await resolveTenantBySlug(tenantSlug)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get user
    const { auth } = await import('@clerk/nextjs/server')
    const clerkAuth = await auth()
    
    if (!clerkAuth.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const user = await import('@/lib/db').then(db => db.prismaRW.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    }))
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = checkoutSchema.parse(body)

    // Get user's cart
    const cart = await import('@/lib/db').then(db => db.prismaRO.cart.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id
        }
      },
      include: {
        cartItems: {
          include: {
            product: true
          }
        }
      }
    }))

    if (!cart || cart.cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Validate stock and calculate totals
    let subtotal = 0
    const orderItems = []

    for (const cartItem of cart.cartItems) {
      if (cartItem.product.stock < cartItem.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${cartItem.product.title}` },
          { status: 400 }
        )
      }

      const itemTotal = cartItem.product.price.toNumber() * cartItem.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
        total: itemTotal
      })
    }

    // Calculate totals (simplified - no tax/shipping for now)
    const tax = 0
    const shipping = 0
    const total = subtotal + tax + shipping

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order
    const order = await import('@/lib/db').then(db => db.prismaRW.order.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        orderNumber,
        status: 'PENDING',
        subtotal,
        tax,
        shipping,
        total,
        currency: 'USD',
        customerJson: validatedData.customer,
        shippingJson: validatedData.shipping,
        notes: validatedData.notes
      }
    }))

    // Create order items
    await import('@/lib/db').then(db => db.prismaRW.orderItem.createMany({
      data: orderItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }))
    }))

    // Update product stock
    for (const cartItem of cart.cartItems) {
      await import('@/lib/db').then(db => db.prismaRW.product.update({
        where: { id: cartItem.productId },
        data: {
          stock: {
            decrement: cartItem.quantity
          }
        }
      }))
    }

    // Create payment record
    const payment = await import('@/lib/db').then(db => db.prismaRW.payment.create({
      data: {
        tenantId: tenant.id,
        orderId: order.id,
        userId: user.id,
        provider: validatedData.paymentProvider,
        amount: total,
        currency: 'USD',
        status: 'PENDING',
        metadata: {
          customer: validatedData.customer,
          shipping: validatedData.shipping
        }
      }
    }))

    // Clear cart
    await import('@/lib/db').then(db => db.prismaRW.cartItem.deleteMany({
      where: { cartId: cart.id }
    }))

    // Generate payment URL (stub for now)
    let paymentUrl = null
    if (validatedData.paymentProvider === 'MYFATOORAH') {
      // In production, integrate with MyFatoorah API
      paymentUrl = `https://myfatoorah.com/pay/${payment.id}`
    } else if (validatedData.paymentProvider === 'KNET') {
      // In production, integrate with KNET API
      paymentUrl = `https://knet.com/pay/${payment.id}`
    } else if (validatedData.paymentProvider === 'STRIPE') {
      // In production, integrate with Stripe API
      paymentUrl = `https://stripe.com/pay/${payment.id}`
    }

    return NextResponse.json({
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          currency: order.currency
        },
        payment: {
          id: payment.id,
          provider: payment.provider,
          amount: payment.amount,
          status: payment.status,
          url: paymentUrl
        }
      },
      message: 'Order created successfully'
    }, { status: 201 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
