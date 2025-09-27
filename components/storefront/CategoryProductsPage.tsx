"use client";

import Link from "next/link";
import Image from "next/image";

interface CategoryProductsPageProps {
  tenant: any;
  tenantSlug: string;
  category: any;
  products: any[];
}

export default function CategoryProductsPage({ tenant, tenantSlug, category, products }: CategoryProductsPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link 
          href={`/${tenantSlug}/categories`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Categories
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 mt-2">{category.description}</p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/${tenantSlug}/products/${product.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {product.imageUrl && (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-lg font-bold text-blue-600">
                  {product.price} KWD
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Products in This Category</h2>
          <p className="text-gray-600">
            Products will appear here once they're added to this category.
          </p>
        </div>
      )}
    </div>
  );
}

