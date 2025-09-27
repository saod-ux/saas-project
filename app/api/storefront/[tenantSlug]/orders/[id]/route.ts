import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/db';
import { requireUserTypeMiddleware, getUserAuthContext } from '@/lib/auth-middleware';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  const logger = log.child({ 
    method: 'GET', 
    path: request.nextUrl.pathname, 
    tenantSlug: params.tenantSlug, 
    orderId: params.id 
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

    // Get order details
    const order = await getDocument('orders', params.id, tenant.id);
    
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // Verify order belongs to the customer
    if (order.customerId !== userContext.uid) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    logger.info('Order details retrieved', { 
      orderId: params.id, 
      customerId: userContext.uid 
    });

    return NextResponse.json({ ok: true, data: order });

  } catch (error) {
    logger.error('Error fetching order:', error);
    
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch order' },
      { status: 500 }
    );
  }
}