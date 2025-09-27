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

    const summary = await InventoryService.getInventorySummary(tenant.id);

    return NextResponse.json({ ok: true, data: summary });
  } catch (error) {
    logger.error('Error fetching inventory summary:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch inventory summary' }, { status: 500 });
  }
}

