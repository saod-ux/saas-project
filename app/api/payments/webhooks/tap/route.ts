import { NextRequest, NextResponse } from 'next/server';
import { getPaymentAdapter } from '@/lib/payments/factory';
import { getTenantDocuments, updateDocument, createDocument } from '@/lib/firebase/tenant';
import { logAction } from '@/lib/rbac';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Find payment by external ID (we'll extract this from the webhook)
    const webhookData = JSON.parse(rawBody);
    const externalId = webhookData.id;
    
    if (!externalId) {
      return NextResponse.json({ error: 'Missing external ID' }, { status: 400 });
    }

    // Find the payment record
    const allPayments = await getTenantDocuments('payments', '');
    const payment = allPayments.find((p: any) => p.externalId === externalId);

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Get payment adapter for this tenant
    const adapter = await getPaymentAdapter(payment.tenantId);
    if (!adapter) {
      return NextResponse.json({ error: 'Payment adapter not found' }, { status: 500 });
    }

    // Verify webhook signature and extract data
    const verificationResult = await adapter.verifyWebhook({
      req: request,
      rawBody,
      headers: request.headers
    });

    if (!verificationResult.ok) {
      return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
    }

    // Create webhook event record
    await createDocument('webhookEvents', {
      provider: 'TAP',
      raw: webhookData,
      processed: true
    });

    // Update payment status
    const updatedPayment = await updateDocument('payments', payment.id, {
      status: verificationResult.status as any,
      rawPayload: webhookData,
      updatedAt: new Date()
    });

    // Log action
    await logAction({
      action: `PAYMENT_${verificationResult.status}`,
      targetType: 'PAYMENT',
      targetId: payment.id,
      tenantId: payment.tenantId,
      meta: {
        externalId,
        status: verificationResult.status,
        amountMinor: payment.amountMinor,
        currency: payment.currency
      },
      request
    });

    // If payment succeeded, update order status
    if (verificationResult.status === 'SUCCEEDED' && payment.orderId) {
      await updateDocument('orders', payment.orderId, {
        status: 'CONFIRMED'
      });

      await logAction({
        action: 'ORDER_PAYMENT_CONFIRMED',
        targetType: 'ORDER',
        targetId: payment.orderId,
        tenantId: payment.tenantId,
        meta: {
          paymentId: payment.id,
          amountMinor: payment.amountMinor,
          currency: payment.currency
        },
        request
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Tap webhook error:', error);
    
    // Log webhook event even if processing failed
    try {
      await createDocument('webhookEvents', {
        provider: 'TAP',
        raw: { error: error instanceof Error ? error.message : String(error) },
        processed: false
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
