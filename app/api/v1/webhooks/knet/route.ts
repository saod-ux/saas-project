import { NextRequest, NextResponse } from 'next/server'
import { getTenantDocuments, updateDocument } from '@/lib/firebase/tenant'
import { z } from 'zod'

const webhookSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  status: z.enum(['success', 'failed', 'pending']),
  amount: z.number().positive(),
  currency: z.string().default('KWD'),
  transactionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/v1/webhooks/knet - Handle KNET payment confirmations
export async function POST(request: NextRequest) {
  try {
    // In production, verify webhook signature
    const signature = request.headers.get('x-knet-signature')
    if (!signature) {
      console.warn('Missing KNET webhook signature')
      // For now, allow without signature in development
    }

    const body = await request.json()
    const validatedData = webhookSchema.parse(body)

    console.log('KNET webhook received:', validatedData)

    // Find the order
    const allOrders = await getTenantDocuments('orders', '');
    const order = allOrders.find((o: any) => o.id === validatedData.orderId);

    if (!order) {
      console.error('Order not found for webhook:', validatedData.orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Find payments for this order
    const allPayments = await getTenantDocuments('payments', '');
    const payments = allPayments.filter((p: any) => p.orderId === order.id);
    
    // Update payment status
    const payment = payments[0];
    if (payment) {
      await updateDocument('payments', payment.id, {
        status: validatedData.status === 'success' ? 'SUCCEEDED' : 'FAILED',
        rawPayload: {
            ...(payment.rawPayload as any || {}),
            webhookData: validatedData,
            processedAt: new Date().toISOString(),
          }
      });
    }

    // Update order status based on payment
    if (validatedData.status === 'success') {
      await updateDocument('orders', order.id, {
        status: 'CONFIRMED'
      });

      // Here you could:
      // - Send confirmation email to customer
      // - Update inventory
      // - Send notification to merchant
      // - Trigger fulfillment process

      console.log('Order marked as paid:', order.id)
    } else if (validatedData.status === 'failed') {
      await updateDocument('orders', order.id, {
        status: 'CANCELLED'
      });

      console.log('Order marked as payment failed:', order.id)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('KNET webhook error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
