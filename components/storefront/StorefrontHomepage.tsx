"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import ProductCard from "./ProductCard";

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
  inventory?: {
    quantity: number;
    trackInventory: boolean;
    allowOutOfStockPurchases: boolean;
  };
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  imageUrl?: string;
  description?: string;
}

interface StorefrontHomepageProps {
  tenant: any;
  tenantSlug: string;
  featuredProducts: Product[];
  bestSellers: Product[];
  newArrivals: Product[];
  categories: Category[];
}

export default function StorefrontHomepage({ tenant, tenantSlug, featuredProducts, bestSellers, newArrivals, categories }: StorefrontHomepageProps) {
  const { language } = useLanguage();

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'welcome_to': { ar: 'مرحباً بك في', en: 'Welcome to' },
      'discover_amazing': { ar: 'اكتشف منتجات رائعة بأسعار ممتازة', en: 'Discover amazing products at great prices' },
      'shop_now': { ar: 'تسوق الآن', en: 'Shop Now' },
      'categories': { ar: 'الفئات', en: 'Categories' },
      'featured_products': { ar: 'المنتجات المميزة', en: 'Featured Products' },
      'best_sellers': { ar: 'الأكثر مبيعاً', en: 'Best Sellers' },
      'new_arrivals': { ar: 'وصل حديثاً', en: 'New Arrivals' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {t('welcome_to')} {tenant.name || tenantSlug}
        </h1>
        <p className="text-xl mb-6">
          {t('discover_amazing')}
        </p>
        <Link 
          href={`/${tenantSlug}/categories`}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          {t('shop_now')}
        </Link>
      </div>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('categories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category) => {
              const displayName = language === 'ar' && category.nameAr ? category.nameAr : category.name;
              return (
                <Link
                  key={category.id}
                  href={`/${tenantSlug}/categories/${category.slug}`}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {category.imageUrl && (
                    <Image
                      src={category.imageUrl}
                      alt={displayName}
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-gray-900">{displayName}</h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('featured_products')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                tenantSlug={tenantSlug} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('best_sellers')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                tenantSlug={tenantSlug} 
              />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t('new_arrivals')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                tenantSlug={tenantSlug} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {featuredProducts.length === 0 && categories.length === 0 && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Store Coming Soon</h2>
          <p className="text-gray-600">
            We're setting up amazing products for you. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
