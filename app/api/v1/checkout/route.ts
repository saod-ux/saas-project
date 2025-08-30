import { NextRequest, NextResponse } from 'next/server'
import { requireMembership } from '@/lib/auth'
import { resolveTenantBySlug } from '@/lib/tenant'
import { prismaRW } from '@/lib/db'
import { z } from 'zod'

const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    productVariantId: z.string().optional(),
    quantity: z.number().positive(),
  })),
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1).default('Kuwait'),
  }),
  paymentMethod: z.enum(['cash', 'myfatoorah', 'knet']),
  notes: z.string().optional(),
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

    const tenant = await resolveTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // For now, allow public checkout (no auth required)
    // In production, you might want to require user registration
    
    const body = await request.json()
    const validatedData = checkoutSchema.parse(body)

    // Calculate totals
    let subtotal = 0
    let total = 0
    const orderItems = []

    for (const item of validatedData.items) {
      const product = await prismaRW.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: item.productVariantId ? {
            where: { id: item.productVariantId }
          } : false
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        )
      }

      if (product.status !== 'active') {
        return NextResponse.json(
          { error: `Product ${product.title} is not available` },
          { status: 400 }
        )
      }

      let price = product.price
      let variantData = null

      if (item.productVariantId && product.variants?.[0]) {
        const variant = product.variants[0]
        price = variant.price
        variantData = {
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
        }
      }

      const itemTotal = price * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: product.id,
        productVariantId: item.productVariantId || null,
        productTitle: product.title,
        variantData,
        quantity: item.quantity,
        unitPrice: price,
        total: itemTotal,
      })
    }

    // Add shipping and tax (placeholder for now)
    const shipping = 0 // Free shipping for now
    const tax = subtotal * 0.05 // 5% tax
    total = subtotal + shipping + tax

    // Create order
    const order = await prismaRW.order.create({
      data: {
        tenantId: tenant.id,
        status: 'pending',
        customerInfo: validatedData.customerInfo,
        totals: {
          subtotal,
          shipping,
          tax,
          total,
        },
        notes: validatedData.notes,
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            variantData: item.variantData,
          }))
        }
      },
      include: {
        items: true
      }
    })

    // Handle payment based on method
    let paymentData = null

    if (validatedData.paymentMethod === 'cash') {
      // Cash on delivery - order stays pending
      paymentData = {
        method: 'cash',
        status: 'pending',
        message: 'Payment on delivery'
      }
    } else if (validatedData.paymentMethod === 'myfatoorah') {
      // MyFatoorah integration using tenant credentials
      if (!tenant.myfatoorahApiKey || !tenant.myfatoorahSecretKey) {
        return NextResponse.json(
          { error: 'MyFatoorah not configured for this store' },
          { status: 400 }
        )
      }
      
      try {
        const paymentUrl = await createMyFatoorahPayment(order, tenant)
        paymentData = {
          method: 'myfatoorah',
          status: 'pending',
          paymentUrl,
          message: 'Redirecting to MyFatoorah...'
        }
      } catch (error) {
        console.error('MyFatoorah payment creation failed:', error)
        return NextResponse.json(
          { error: 'Failed to create MyFatoorah payment' },
          { status: 500 }
        )
      }
    } else if (validatedData.paymentMethod === 'knet') {
      // KNET integration using tenant credentials
      if (!tenant.knetMerchantId || !tenant.knetApiKey) {
        return NextResponse.json(
          { error: 'KNET not configured for this store' },
          { status: 400 }
        )
      }
      
      try {
        const paymentUrl = await createKNETPayment(order, tenant)
        paymentData = {
          method: 'knet',
          status: 'pending',
          paymentUrl,
          message: 'Redirecting to KNET...'
        }
      } catch (error) {
        console.error('KNET payment creation failed:', error)
        return NextResponse.json(
          { error: 'Failed to create KNET payment' },
          { status: 500 }
        )
      }
    }

    // Create payment record
    if (paymentData) {
      await prismaRW.payment.create({
        data: {
          orderId: order.id,
          tenantId: tenant.id,
          amount: total,
          currency: 'KWD',
          method: paymentData.method,
          status: paymentData.status,
          metadata: paymentData
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: order.id,
          status: order.status,
          total: order.totals.total,
          items: order.items.length,
        },
        payment: paymentData,
        message: 'Order created successfully'
      }
    })

  } catch (error: any) {
    console.error('Checkout error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create MyFatoorah payment using tenant credentials
async function createMyFatoorahPayment(order: any, tenant: any) {
  const baseUrl = tenant.myfatoorahIsTest 
    ? 'https://apitest.myfatoorah.com' 
    : 'https://api.myfatoorah.com'
  
  const response = await fetch(`${baseUrl}/v2/ExecutePayment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tenant.myfatoorahApiKey}`
    },
    body: JSON.stringify({
      InvoiceAmount: order.totals.total,
      CurrencyIso: 'KWD',
      CustomerName: order.customerInfo.name,
      CustomerEmail: order.customerInfo.email,
      CustomerMobile: order.customerInfo.phone,
      CustomerReference: order.id,
      CustomerCivilId: '',
      UserDefinedField: order.id,
      CallBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/webhooks/myfatoorah`,
      ErrorUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/error`,
      Language: 'en',
      ExpiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      DisplayCurrencyIso: 'KWD',
      InvoiceItems: order.items.map((item: any) => ({
        ItemName: item.productTitle,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice,
        Weight: 0
      }))
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`MyFatoorah API error: ${error}`)
  }

  const result = await response.json()
  
  if (result.IsSuccess) {
    return result.Data.PaymentURL
  } else {
    throw new Error(result.ErrorMessage || 'MyFatoorah payment creation failed')
  }
}

// Create KNET payment using tenant credentials
async function createKNETPayment(order: any, tenant: any) {
  // KNET integration would go here
  // For now, return a placeholder URL
  // In production, implement actual KNET API integration
  
  const baseUrl = tenant.knetIsTest 
    ? 'https://test.knet.com.kw' 
    : 'https://knet.com.kw'
  
  // This is a placeholder - implement actual KNET integration
  return `${baseUrl}/payment?merchant=${tenant.knetMerchantId}&order=${order.id}&amount=${order.totals.total}`
}
