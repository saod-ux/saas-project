import { NextRequest, NextResponse } from 'next/server';
import { SearchService } from '@/lib/services/search';
import { log } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  const logger = log.child({ method: 'GET', path: request.nextUrl.pathname, tenantSlug: params.tenantSlug });
  
  try {
    // Get tenant ID from slug
    const { getTenantDocuments } = await import('@/lib/db');
    const tenants = await getTenantDocuments('tenants', '');
    const tenant = tenants.find((t: any) => t.slug === params.tenantSlug);
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 });
    }

    const filters = await SearchService.getSearchFilters(tenant.id);

    return NextResponse.json({ ok: true, data: filters });
  } catch (error) {
    logger.error('Error getting search filters:', error);
    return NextResponse.json({ ok: false, error: 'Failed to get search filters' }, { status: 500 });
  }
}

