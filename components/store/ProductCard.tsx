"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Clock, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    nameAr?: string;
    price: number;
    imageUrl?: string | null;
    preparationTime?: number | null;
    isAvailable?: boolean;
  };
  onAddToCart: (productId: string) => void;
  onBuyNow: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart, onBuyNow }: ProductCardProps) {
  const { t, isRTL, lang } = useLanguage();
  
  const displayName = lang === 'ar' && product.nameAr ? product.nameAr : product.name;
  const isAvailable = product.isAvailable !== false;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-gray-400 text-sm">{t("products.noImage")}</span>
          </div>
        )}
        
        {/* Preparation Time Badge */}
        {product.preparationTime && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">
              {product.preparationTime} {t("mobile.preparationTime")}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {displayName}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-gray-900">
            {product.price} {t("products.currency")}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={() => onAddToCart(product.id)}
            disabled={!isAvailable}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("mobile.addToCart")}
          </Button>
          
          <Button
            size="sm"
            className="flex-1 h-9 bg-blue-600 hover:bg-blue-700"
            onClick={() => onBuyNow(product.id)}
            disabled={!isAvailable}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {t("mobile.buyNow")}
          </Button>
        </div>

        {!isAvailable && (
          <p className="text-sm text-red-500 mt-2 text-center">
            {t("products.outOfStock")}
          </p>
        )}
      </div>
    </div>
  );
}
