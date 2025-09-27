"use client";

interface SearchPageProps {
  tenant: any;
  tenantSlug: string;
}

export default function SearchPage({ tenant, tenantSlug }: SearchPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Products</h1>
      
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          Advanced search functionality will be implemented in the next phase.
        </p>
        <a
          href={`/${tenantSlug}/categories`}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Browse Categories
        </a>
      </div>
    </div>
  );
}

