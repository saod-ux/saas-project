import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAndRole } from '@/lib/rbac';
import { InventoryService } from '@/lib/services/inventory';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'GET', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
  try {
    const rbacResult = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'STAFF']);
    if (rbacResult instanceof NextResponse) return rbacResult;
    const { tenant } = rbacResult;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const movements = await InventoryService.getStockMovements(tenant.id, productId || undefined, limit);

    return NextResponse.json({ ok: true, data: movements });
  } catch (error) {
    logger.error('Error fetching stock movements:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch stock movements' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'POST', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
  try {
    const rbacResult = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'STAFF']);
    if (rbacResult instanceof NextResponse) return rbacResult;
    const { tenant, user } = rbacResult;

    const body = await request.json();
    const { productId, type, quantity, reason, reference } = body;

    if (!productId || !type || quantity === undefined || !reason) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing required fields: productId, type, quantity, reason' 
      }, { status: 400 });
    }

    const movement = await InventoryService.recordStockMovement(
      tenant.id,
      productId,
      type,
      quantity,
      reason,
      reference,
      user.uid
    );

    return NextResponse.json({ ok: true, data: movement, message: 'Stock movement recorded successfully' });
  } catch (error) {
    logger.error('Error recording stock movement:', error);
    return NextResponse.json({ ok: false, error: 'Failed to record stock movement' }, { status: 500 });
  }
}

