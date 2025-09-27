"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  imageUrl?: string;
  description?: string;
}

interface CategoriesClientProps {
  tenant: any;
  tenantSlug: string;
  categories: Category[];
}

export default function CategoriesClient({ tenant, tenantSlug, categories }: CategoriesClientProps) {
  const { language } = useLanguage();

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'categories': { ar: 'الفئات', en: 'Categories' },
      'browse_by_category': { ar: 'تصفح حسب الفئة', en: 'Browse by Category' },
      'no_categories': { ar: 'لا توجد فئات متاحة', en: 'No categories available' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('categories')}</h1>
        <p className="text-xl text-gray-600">{t('browse_by_category')}</p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">{t('no_categories')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => {
            const displayName = language === 'ar' && category.nameAr ? category.nameAr : category.name;
            const displayDescription = language === 'ar' && category.description ? category.description : category.description;
            
            return (
              <Link
                key={category.id}
                href={`/${tenantSlug}/categories/${category.slug}`}
                className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={displayName}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 text-2xl font-bold">
                        {displayName.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {displayName}
                  </h3>
                  {displayDescription && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {displayDescription}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}