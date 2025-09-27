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
    const acknowledged = searchParams.get('acknowledged');
    
    const alerts = await InventoryService.getInventoryAlerts(
      tenant.id,
      acknowledged ? acknowledged === 'true' : undefined
    );

    return NextResponse.json({ ok: true, data: alerts });
  } catch (error) {
    logger.error('Error fetching inventory alerts:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch inventory alerts' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'POST', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
  try {
    const rbacResult = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN']);
    if (rbacResult instanceof NextResponse) return rbacResult;
    const { tenant } = rbacResult;

    // Trigger low stock check
    const alerts = await InventoryService.checkLowStockAlerts(tenant.id);

    return NextResponse.json({ ok: true, data: alerts, message: `Generated ${alerts.length} inventory alerts` });
  } catch (error) {
    logger.error('Error checking low stock alerts:', error);
    return NextResponse.json({ ok: false, error: 'Failed to check low stock alerts' }, { status: 500 });
  }
}

