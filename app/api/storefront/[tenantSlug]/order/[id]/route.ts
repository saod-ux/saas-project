import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveTenantBySlug } from '@/lib/tenant'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const { tenantSlug, id } = params

    // Get tenant
    const tenant = await resolveTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'TENANT_NOT_FOUND' }, { status: 404 })
    }

    // Fetch order
    const order = await prisma.order.findFirst({
      where: {
        id: id,
        tenantId: tenant.id
      },
      include: {
        orderItems: {
          select: {
            id: true,
            productId: true,
            nameSnapshot: true,
            priceSnapshot: true,
            quantity: true,
            total: true
          }
        },
        tenantUser: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            isGuest: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 })
    }

    // Format response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt.toISOString(),
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        nameSnapshot: item.nameSnapshot,
        priceSnapshot: Number(item.priceSnapshot),
        quantity: item.quantity,
        total: Number(item.total)
      }))
    }

    return NextResponse.json({
      ok: true,
      data: formattedOrder
    })

  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'INTERNAL_ERROR' 
    }, { status: 500 })
  }
}
