import { getTenantBySlug } from "@/lib/services/tenant";
import { notFound } from "next/navigation";
import ProductSearch from "@/components/storefront/ProductSearch";

export default async function SearchPage({ 
  params,
  searchParams 
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  const { q, category, minPrice, maxPrice, sortBy, sortOrder, page } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductSearch 
          tenantSlug={tenantSlug}
          initialQuery={typeof q === 'string' ? q : ''}
          initialCategory={typeof category === 'string' ? category : ''}
          initialMinPrice={typeof minPrice === 'string' ? parseFloat(minPrice) : undefined}
          initialMaxPrice={typeof maxPrice === 'string' ? parseFloat(maxPrice) : undefined}
          initialSortBy={typeof sortBy === 'string' ? sortBy : 'name'}
          initialSortOrder={typeof sortOrder === 'string' ? sortOrder : 'asc'}
          initialPage={typeof page === 'string' ? parseInt(page) : 1}
        />
      </div>
    </div>
  );
}