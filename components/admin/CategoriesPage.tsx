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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add Category
        </button>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border p-6">
              {category.imageUrl && (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  width={200}
                  height={150}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Slug: {category.slug}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Categories Yet</h2>
          <p className="text-gray-600 mb-6">
            Organize your products by creating categories.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Create Your First Category
          </button>
        </div>
      )}
    </div>
  );
}

