import { getTenantBySlug } from "@/lib/firebase/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Empty } from "@/components/ui/Empty";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CategoryPage({ 
  params, 
  searchParams 
}: {
  params: { tenantSlug: string; slug: string };
  searchParams?: { page?: string };
}) {
  // Resolve tenant
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) notFound();

  // Mock category data for now
  const categoryMap: Record<string, { name: string; products: any[] }> = {
    burgers: {
      name: "Burgers",
      products: [
        { id: "1", name: "Classic Burger", price: "3.5" },
        { id: "2", name: "Cheese Burger", price: "4.0" },
        { id: "3", name: "Bacon Burger", price: "4.5" },
        { id: "4", name: "Veggie Burger", price: "3.0" },
      ]
    },
    pizza: {
      name: "Pizza",
      products: [
        { id: "5", name: "Margherita Pizza", price: "5.0" },
        { id: "6", name: "Pepperoni Pizza", price: "6.0" },
        { id: "7", name: "BBQ Chicken Pizza", price: "7.0" },
      ]
    },
    drinks: {
      name: "Drinks",
      products: [
        { id: "8", name: "Coca Cola", price: "1.5" },
        { id: "9", name: "Orange Juice", price: "2.0" },
        { id: "10", name: "Coffee", price: "2.5" },
      ]
    },
    desserts: {
      name: "Desserts",
      products: [
        { id: "11", name: "Chocolate Cake", price: "3.0" },
        { id: "12", name: "Ice Cream", price: "2.5" },
      ]
    }
  };

  const category = categoryMap[params.slug];
  if (!category) notFound();

  const page = parseInt(searchParams?.page || "1");
  const productsPerPage = 12;
  const skip = (page - 1) * productsPerPage;

  const products = category.products.slice(skip, skip + productsPerPage);
  const totalProducts = category.products.length;
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/${params.tenantSlug}/retail`}
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
              >
                ← Back to categories
              </Link>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                {category.name}
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              {totalProducts} {totalProducts === 1 ? "product" : "products"}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border bg-white hover:shadow-sm transition"
                >
                  <div className="aspect-square overflow-hidden rounded-t-xl bg-neutral-200" />
                  <div className="p-3">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      {product.price ? `${product.price} KWD` : "Price TBD"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Estimated preparation time
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button className="flex-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
                        Add +
                      </button>
                      <button className="flex-1 rounded-lg bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800 transition-colors">
                        Buy now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  {page > 1 && (
                    <Link
                      href={`/${params.tenantSlug}/category/${params.slug}?page=${page - 1}`}
                      className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  
                  {page < totalPages && (
                    <Link
                      href={`/${params.tenantSlug}/category/${params.slug}?page=${page + 1}`}
                      className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <Empty
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            }
            title="No products found"
            description="This category doesn't have any products yet."
            action={{
              label: "← Back to categories",
              onClick: () => window.location.href = `/${params.tenantSlug}/retail`
            }}
          />
        )}
      </div>
    </div>
  );
}
