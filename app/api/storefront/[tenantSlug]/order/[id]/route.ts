import { NextRequest, NextResponse } from 'next/server'
import { getTenantBySlug, getTenantDocuments } from '@/lib/firebase/tenant'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const { tenantSlug, id } = params

    // Get tenant
    const tenant = await getTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'TENANT_NOT_FOUND' }, { status: 404 })
    }

    // Fetch order
    const allOrders = await getTenantDocuments('orders', tenant.id)
    const order = allOrders.find((o: any) => o.id === id)

    if (!order) {
      return NextResponse.json({ ok: false, error: 'ORDER_NOT_FOUND' }, { status: 404 })
    }

    // Fetch order items
    const allOrderItems = await getTenantDocuments('orderItems', tenant.id)
    const orderItems = allOrderItems.filter((item: any) => item.orderId === order.id)

    // Fetch user info if needed
    const allUsers = await getTenantDocuments('users', '')
    const user = allUsers.find((u: any) => u.id === order.userId)

    // Format response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName || user?.name,
      customerEmail: order.customerEmail || user?.email,
      customerPhone: order.customerPhone || user?.phone,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax || 0),
      shipping: Number(order.shipping || 0),
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt,
      orderItems: orderItems.map((item: any) => ({
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
