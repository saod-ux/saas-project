"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  isPlaceholder?: boolean;
}

interface SlidableCategoriesProps {
  categories: Category[];
  tenantSlug: string;
  tenantLogo?: string | null;
}

export default function SlidableCategories({ categories, tenantSlug, tenantLogo }: SlidableCategoriesProps) {
  const { language, isRTL } = useLanguage();
  
  // Create placeholder categories for empty state
  const placeholderCategories = Array(6).fill(null).map((_, index) => ({
    id: `placeholder-${index}`,
    name: `Category ${index + 1}`,
    nameAr: `فئة ${index + 1}`,
    slug: `category-${index + 1}`,
    imageUrl: null,
    isActive: true,
    isPlaceholder: true
  }));

  // Use actual categories or placeholders
  const displayCategories = categories.length > 0 ? categories : placeholderCategories;
  const hasRealCategories = categories.length > 0;

  const getCategoryName = (category: Category) => {
    if (category.isPlaceholder) {
      return language === 'ar' ? (category.nameAr || category.name) : category.name;
    }
    return language === 'ar' && category.nameAr ? category.nameAr : category.name;
  };

  const getLocalizedText = (en: string, ar: string) => {
    return language === 'ar' ? ar : en;
  };

  return (
    <section className={`py-16 bg-gradient-to-br from-gray-50 to-white ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {hasRealCategories 
              ? getLocalizedText('Shop by Category', 'تسوق حسب الفئة')
              : getLocalizedText('Categories Coming Soon', 'الفئات قادمة قريباً')
            }
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {hasRealCategories 
              ? getLocalizedText(
                  'Discover our carefully curated collection organized by category',
                  'اكتشف مجموعتنا المختارة بعناية والمنظمة حسب الفئة'
                )
              : getLocalizedText(
                  'We\'re setting up amazing categories for you to explore',
                  'نحن نعد فئات رائعة لك لاستكشافها'
                )
            }
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {displayCategories.map((category) => {
            const isPlaceholder = category.isPlaceholder;
            const categoryName = getCategoryName(category);
            
            return (
              <Link
                key={category.id}
                href={isPlaceholder ? '#' : `/${tenantSlug}/categories/${category.slug}`}
                className={`group relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 ${
                  isPlaceholder
                    ? 'cursor-default animate-pulse'
                    : 'cursor-pointer hover:shadow-xl'
                }`}
              >
                <div className={`aspect-square relative overflow-hidden rounded-2xl ${
                  isPlaceholder
                    ? 'bg-gray-200'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-50 group-hover:to-blue-100'
                }`}>
                  {/* Category Image or Icon */}
                  {category.imageUrl && !isPlaceholder ? (
                    <Image
                      src={category.imageUrl}
                      alt={categoryName}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isPlaceholder ? (
                        <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-400 group-hover:bg-blue-400">
                          <svg 
                            className="w-6 h-6 text-gray-600 group-hover:text-white" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Category Name */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl">
                  <h3 className={`text-sm font-semibold text-center truncate ${
                    isPlaceholder
                      ? 'text-gray-400'
                      : 'text-white group-hover:text-white'
                  }`}>
                    {isPlaceholder ? getLocalizedText('Loading...', 'جاري التحميل...') : categoryName}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
