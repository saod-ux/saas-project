import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAndRole } from '@/lib/rbac';
import { InventoryService } from '@/lib/services/inventory';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  const logger = log.child({ method: 'PATCH', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug, alertId: params.id });
  
  try {
    const rbacResult = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN', 'STAFF']);
    if (rbacResult instanceof NextResponse) return rbacResult;
    const { tenant, user } = rbacResult;

    await InventoryService.acknowledgeAlert(tenant.id, params.id, user.uid);

    return NextResponse.json({ ok: true, message: 'Alert acknowledged successfully' });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    return NextResponse.json({ ok: false, error: 'Failed to acknowledge alert' }, { status: 500 });
  }
}

