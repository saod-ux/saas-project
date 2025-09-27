"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import ProductCard from "@/components/storefront/ProductCard";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  imageUrl?: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  compareAtPrice?: number;
  primaryImageUrl?: string;
  status: string;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
}

interface CategoryDetailClientProps {
  tenant: any;
  tenantSlug: string;
  category: Category;
  products: Product[];
}

export default function CategoryDetailClient({ tenant, tenantSlug, category, products }: CategoryDetailClientProps) {
  const { language } = useLanguage();

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'categories': { ar: 'الفئات', en: 'Categories' },
      'home': { ar: 'الرئيسية', en: 'Home' },
      'products_in_category': { ar: 'المنتجات في هذه الفئة', en: 'Products in this category' },
      'no_products': { ar: 'لا توجد منتجات في هذه الفئة', en: 'No products in this category' },
      'showing_products': { ar: 'عرض المنتجات', en: 'Showing products' },
    };
    return translations[key]?.[language] || key;
  };

  const displayName = language === 'ar' && category.nameAr ? category.nameAr : category.name;
  const displayDescription = language === 'ar' && category.description ? category.description : category.description;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href={`/${tenantSlug}`} className="text-blue-600 hover:text-blue-800">
          {t('home')}
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <Link href={`/${tenantSlug}/categories`} className="text-blue-600 hover:text-blue-800">
          {t('categories')}
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-900">{displayName}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Category Image */}
          {category.imageUrl && (
            <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={category.imageUrl}
                alt={displayName}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Category Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayName}</h1>
            {displayDescription && (
              <p className="text-lg text-gray-600 mb-4">{displayDescription}</p>
            )}
            <p className="text-sm text-gray-500">
              {products.length} {products.length === 1 ? 'product' : 'products'} {language === 'ar' ? 'في هذه الفئة' : 'in this category'}
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">{t('no_products')}</p>
          <Link 
            href={`/${tenantSlug}/categories`}
            className="inline-block mt-4 text-blue-600 hover:text-blue-800"
          >
            {t('categories')}
          </Link>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('products_in_category')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                tenantSlug={tenantSlug} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

