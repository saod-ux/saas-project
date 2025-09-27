import { NextRequest, NextResponse } from 'next/server';
import { SearchService, SearchFilters } from '@/lib/services/search';
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

    // Parse search parameters
    const { searchParams } = new URL(request.url);
    const filters: SearchFilters = {
      query: searchParams.get('q') || undefined,
      categoryId: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      status: 'active', // Only show active products in storefront
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    };

    const searchResult = await SearchService.searchProducts(tenant.id, filters);

    return NextResponse.json({ ok: true, data: searchResult });
  } catch (error) {
    logger.error('Error searching products:', error);
    return NextResponse.json({ ok: false, error: 'Failed to search products' }, { status: 500 });
  }
}

