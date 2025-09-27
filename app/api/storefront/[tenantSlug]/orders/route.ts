import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/db';
import { requireUserTypeMiddleware, getUserAuthContext } from '@/lib/auth-middleware';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'GET', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
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

    // Get all orders for the tenant
    const orders = await getDocument('orders', '', tenant.id);
    
    // Filter orders for the current customer
    const customerOrders = orders.filter((order: any) => order.customerId === userContext.uid);

    logger.info('Customer orders retrieved', { 
      customerId: userContext.uid, 
      orderCount: customerOrders.length 
    });

    return NextResponse.json({ ok: true, data: customerOrders });

  } catch (error) {
    logger.error('Error fetching customer orders:', error);
    
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}