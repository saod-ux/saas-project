import { NextRequest, NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/db';
import { requireUserTypeMiddleware, getUserAuthContext } from '@/lib/auth-middleware';
import { z } from 'zod';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ProcessPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']),
  provider: z.string().min(1, 'Payment provider is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  description: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'POST', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
  try {
    // Ensure user is authenticated
    const authCheck = await requireUserTypeMiddleware(request, ['customer'], request.nextUrl.pathname);
    if (authCheck) return authCheck;

    const userContext = await getUserAuthContext(request);
    if (!userContext || !userContext.isAuthenticated || userContext.userType !== 'customer') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const paymentData = ProcessPaymentSchema.parse(body);

    logger.info('Processing payment', { orderId: paymentData.orderId, amount: paymentData.amount });

    // Get tenant info
    const tenants = await getDocument('tenants', '', '');
    const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Get order details
    const order = await getDocument('orders', paymentData.orderId, tenant.id);
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // Verify order belongs to the customer
    if (order.customerId !== userContext.uid) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Verify payment amount matches order total
    if (Math.abs(order.total - paymentData.amount) > 0.01) {
      return NextResponse.json({ ok: false, error: 'Payment amount mismatch' }, { status: 400 });
    }

    // Process payment based on provider
    let paymentResult;
    
    switch (paymentData.provider) {
      case 'mock':
        // Mock payment processing for development
        paymentResult = await processMockPayment(paymentData, order);
        break;
      case 'stripe':
        // TODO: Implement Stripe payment processing
        paymentResult = { success: false, error: 'Stripe integration not implemented yet' };
        break;
      case 'paypal':
        // TODO: Implement PayPal payment processing
        paymentResult = { success: false, error: 'PayPal integration not implemented yet' };
        break;
      default:
        return NextResponse.json({ ok: false, error: 'Unsupported payment provider' }, { status: 400 });
    }

    if (!paymentResult.success) {
      logger.warn('Payment processing failed', { error: paymentResult.error });
      return NextResponse.json({ ok: false, error: paymentResult.error }, { status: 400 });
    }

    // Update order with payment information
    const updatedOrder = await updateDocument('orders', paymentData.orderId, {
      paymentInfo: {
        ...order.paymentInfo,
        status: 'COMPLETED',
        transactionId: paymentResult.transactionId,
        processedAt: new Date().toISOString(),
      },
      status: 'CONFIRMED',
      updatedAt: new Date().toISOString(),
    }, tenant.id);

    logger.info('Payment processed successfully', { 
      orderId: paymentData.orderId, 
      transactionId: paymentResult.transactionId 
    });

    return NextResponse.json({ 
      ok: true, 
      success: true,
      transactionId: paymentResult.transactionId,
      order: updatedOrder
    });

  } catch (error) {
    logger.error('Payment processing error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payment data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// Mock payment processing function
async function processMockPayment(paymentData: any, order: any) {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock payment success (90% success rate for testing)
  const isSuccess = Math.random() > 0.1;
  
  if (isSuccess) {
    return {
      success: true,
      transactionId: `MOCK_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      provider: 'mock',
      amount: paymentData.amount,
      currency: paymentData.currency,
    };
  } else {
    return {
      success: false,
      error: 'Mock payment failed - insufficient funds',
    };
  }
}