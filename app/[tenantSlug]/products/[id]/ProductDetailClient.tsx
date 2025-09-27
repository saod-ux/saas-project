"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cart";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import ProductCard from "@/components/storefront/ProductCard";

interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  primaryImageUrl?: string;
  gallery: string[];
  status: string;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  inventory: {
    quantity: number;
    trackInventory: boolean;
    allowOutOfStockPurchases: boolean;
  };
}

interface ProductDetailClientProps {
  tenant: any;
  tenantSlug: string;
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({ tenant, tenantSlug, product, relatedProducts }: ProductDetailClientProps) {
  const { language } = useLanguage();
  const { addItem } = useCartStore();
  const [selectedImage, setSelectedImage] = useState(product.primaryImageUrl || product.gallery[0] || '');
  const [quantity, setQuantity] = useState(1);

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'add_to_cart': { ar: 'أضف للسلة', en: 'Add to Cart' },
      'out_of_stock': { ar: 'نفد المخزون', en: 'Out of Stock' },
      'best_seller': { ar: 'الأكثر مبيعاً', en: 'Best Seller' },
      'new_arrival': { ar: 'وصل حديثاً', en: 'New Arrival' },
      'featured': { ar: 'مميز', en: 'Featured' },
      'quantity': { ar: 'الكمية', en: 'Quantity' },
      'description': { ar: 'الوصف', en: 'Description' },
      'related_products': { ar: 'منتجات ذات صلة', en: 'Related Products' },
      'in_stock': { ar: 'متوفر', en: 'In Stock' },
      'low_stock': { ar: 'كمية محدودة', en: 'Low Stock' },
    };
    return translations[key]?.[language] || key;
  };

  const displayName = language === 'ar' && product.nameAr ? product.nameAr : product.name;
  const displayDescription = language === 'ar' && product.description ? product.description : product.description;
  
  const isInStock = product.inventory.allowOutOfStockPurchases || product.inventory.quantity > 0;
  const isLowStock = product.inventory.trackInventory && product.inventory.quantity > 0 && product.inventory.quantity <= 5;

  const handleAddToCart = () => {
    if (isInStock) {
      addItem({
        id: product.id,
        name: displayName,
        price: product.price,
        image: selectedImage,
        quantity: quantity
      });
    }
  };

  const images = [product.primaryImageUrl, ...product.gallery].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href={`/${tenantSlug}`} className="text-blue-600 hover:text-blue-800">
          {language === 'ar' ? 'الرئيسية' : 'Home'}
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-900">{displayName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={displayName}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-lg">No Image</span>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                    selectedImage === image ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${displayName} ${index + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {product.isBestSeller && (
              <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                {t('best_seller')}
              </span>
            )}
            {product.isNewArrival && (
              <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full">
                {t('new_arrival')}
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                {t('featured')}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{displayName}</h1>

          {/* Price */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {product.price.toFixed(3)} KWD
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xl text-gray-500 line-through">
                {product.compareAtPrice.toFixed(3)} KWD
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            {isInStock ? (
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-medium">
                  {isLowStock ? t('low_stock') : t('in_stock')}
                </span>
                {product.inventory.trackInventory && (
                  <span className="text-sm text-gray-500">
                    ({product.inventory.quantity} {language === 'ar' ? 'متوفر' : 'available'})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-red-600 font-medium">{t('out_of_stock')}</span>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium text-gray-700">{t('quantity')}:</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!isInStock}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                isInStock
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isInStock ? t('add_to_cart') : t('out_of_stock')}
            </button>
          </div>

          {/* Description */}
          {displayDescription && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('description')}</h2>
              <p className="text-gray-600 leading-relaxed">{displayDescription}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('related_products')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard 
                key={relatedProduct.id} 
                product={relatedProduct} 
                tenantSlug={tenantSlug} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

