import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/db';
import { requireUserTypeMiddleware, getUserAuthContext } from '@/lib/auth-middleware';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; transactionId: string } }
) {
  const logger = log.child({ 
    method: 'GET', 
    path: request.nextUrl.pathname, 
    tenantSlug: params.tenantSlug,
    transactionId: params.transactionId 
  });
  
  try {
    // Ensure user is authenticated
    const authCheck = await requireUserTypeMiddleware(request, ['customer'], request.nextUrl.pathname);
    if (authCheck) return authCheck;

    const userContext = await getUserAuthContext(request);
    if (!userContext || !userContext.isAuthenticated || userContext.userType !== 'customer') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant info
    const tenants = await getDocument('tenants', '', '');
    const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Find order with this transaction ID
    const orders = await getDocument('orders', '', tenant.id);
    const order = orders.find((o: any) => o.paymentInfo?.transactionId === params.transactionId);
    
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Transaction not found' }, { status: 404 });
    }

    // Verify order belongs to the customer
    if (order.customerId !== userContext.uid) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    logger.info('Payment status retrieved', { 
      transactionId: params.transactionId,
      status: order.paymentInfo.status 
    });

    return NextResponse.json({ 
      ok: true, 
      data: {
        transactionId: params.transactionId,
        status: order.paymentInfo.status,
        amount: order.paymentInfo.amount,
        currency: order.paymentInfo.currency,
        method: order.paymentInfo.method,
        processedAt: order.paymentInfo.processedAt,
        orderId: order.id,
        orderNumber: order.orderNumber,
      }
    });

  } catch (error) {
    logger.error('Payment status check error:', error);
    
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

