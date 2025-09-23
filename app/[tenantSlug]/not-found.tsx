import { loadTenantBySlug } from "@/lib/loadTenant";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function NotFound({ params }: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const resolvedParams = await params;
  const tenantSlug = resolvedParams?.tenantSlug;
  
  if (!tenantSlug) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600">Sorry, we couldn't find the page you're looking for.</p>
        </div>
      </div>
    );
  }
  
  const tenant = await loadTenantBySlug(tenantSlug);
  
  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          {tenant.logoUrl ? (
            <img 
              src={tenant.logoUrl} 
              alt={tenant.name} 
              className="h-16 w-16 mx-auto object-contain"
            />
          ) : (
            <div className="h-16 w-16 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-600">
                {tenant.name[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Error Content */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        {/* Back to Store Button */}
        <div className="space-y-4">
          <Link 
            href={`/${tenantSlug}`}
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Back to {tenant.name}
          </Link>
          
          <div className="text-sm text-gray-500">
            <Link 
              href={`/${tenantSlug}/retail`}
              className="hover:text-gray-700 underline"
            >
              Browse Products
            </Link>
            {" • "}
            <Link 
              href={`/${tenantSlug}/categories`}
              className="hover:text-gray-700 underline"
            >
              Categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
