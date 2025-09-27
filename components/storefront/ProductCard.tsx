"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCartStore } from "@/stores/cart";

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

interface ProductCardProps {
  product: Product;
  tenantSlug: string;
}

export default function ProductCard({ product, tenantSlug }: ProductCardProps) {
  const { language } = useLanguage();
  const { addItem } = useCartStore();

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'add_to_cart': { ar: 'أضف للسلة', en: 'Add to Cart' },
      'out_of_stock': { ar: 'نفد المخزون', en: 'Out of Stock' },
      'best_seller': { ar: 'الأكثر مبيعاً', en: 'Best Seller' },
      'new_arrival': { ar: 'وصل حديثاً', en: 'New Arrival' },
      'featured': { ar: 'مميز', en: 'Featured' },
    };
    return translations[key]?.[language] || key;
  };

  const displayName = language === 'ar' && product.nameAr ? product.nameAr : product.name;
  const isInStock = product.status === 'active' && (
    !product.inventory?.trackInventory || 
    product.inventory?.allowOutOfStockPurchases || 
    (product.inventory?.quantity || 0) > 0
  );

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInStock) {
      addItem({
        id: product.id,
        name: displayName,
        price: product.price,
        image: product.primaryImageUrl || '',
        quantity: 1
      });
    }
  };

  return (
    <Link href={`/${tenantSlug}/products/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={displayName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isBestSeller && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {t('best_seller')}
              </span>
            )}
            {product.isNewArrival && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {t('new_arrival')}
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {t('featured')}
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
            {displayName}
          </h3>
          
          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              {product.price.toFixed(3)} KWD
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {product.compareAtPrice.toFixed(3)} KWD
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!isInStock}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              isInStock
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isInStock ? t('add_to_cart') : t('out_of_stock')}
          </button>
        </div>
      </div>
    </Link>
  );
}
