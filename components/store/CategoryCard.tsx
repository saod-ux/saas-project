"use client";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChevronDown, ChevronUp } from "lucide-react";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  imageUrl?: string | null;
  preparationTime?: number | null;
  isAvailable?: boolean;
}

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    nameAr?: string;
    imageUrl?: string | null;
  };
  products: Product[];
  onAddToCart: (productId: string) => void;
  onBuyNow: (productId: string) => void;
}

export default function CategoryCard({ category, products, onAddToCart, onBuyNow }: CategoryCardProps) {
  const { t, isRTL, lang } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayName = lang === 'ar' && category.nameAr ? category.nameAr : category.name;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Category Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {category.imageUrl ? (
              <img
                src={category.imageUrl}
                alt={displayName}
                className="h-12 w-12 object-cover rounded-lg"
              />
            ) : (
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {displayName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{displayName}</h3>
              <p className="text-sm text-gray-500">
                {products.length} {products.length === 1 ? t("products.title").slice(0, -1) : t("products.title")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {isExpanded ? t("common.close") : t("common.view")}
            </span>
            {isRTL ? (
              isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              isExpanded ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronUp className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">{t("products.noProductsAvailable")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
