"use client";

import Link from "next/link";
import Image from "next/image";

interface CategoriesPageProps {
  tenant: any;
  tenantSlug: string;
  categories: any[];
}

export default function CategoriesPage({ tenant, tenantSlug, categories }: CategoriesPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Categories</h1>
      
      {categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${tenantSlug}/categories/${category.slug}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {category.imageUrl && (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  width={300}
                  height={200}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Categories Yet</h2>
          <p className="text-gray-600">
            Categories will appear here once they're added to your store.
          </p>
        </div>
      )}
    </div>
  );
}

