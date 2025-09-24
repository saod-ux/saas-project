"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  imageUrl: string | null;
  gallery: string[];
  sku?: string | null;
  primaryCategoryId?: string | null;
  categories?: {
    name: string;
    slug: string;
  } | null;
  customFields?: Array<{
    id: string;
    title: string;
    options: string[];
  }>;
}

interface ProductPageClientProps {
  product: Product;
  tenantSlug: string;
}

export default function ProductPageClient({ product, tenantSlug }: ProductPageClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedCustomFields, setSelectedCustomFields] = useState<Record<string, string>>({});
  const [isArabic, setIsArabic] = useState(false);

  // Debug logging
  console.log('Product data:', product);
  console.log('Categories:', product.categories);

  // Detect language from document
  useEffect(() => {
    const checkLanguage = () => {
      if (typeof document !== 'undefined') {
        const lang = document.documentElement.lang || 'en';
        const dir = document.documentElement.dir || 'ltr';
        setIsArabic(lang.startsWith('ar') || dir === 'rtl');
      }
    };
    
    checkLanguage();
    
    // Listen for language changes
    const handleLanguageChange = () => checkLanguage();
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  // Translation function
  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'back_to_category': { ar: 'العودة إلى', en: 'Back to' },
      'no_image': { ar: 'لا توجد صورة', en: 'No Image' },
      'category': { ar: 'الفئة:', en: 'Category:' },
      'available_options': { ar: 'الخيارات المتاحة', en: 'Available Options' },
      'quantity': { ar: 'الكمية', en: 'Quantity' },
      'add_to_cart': { ar: 'أضف إلى السلة', en: 'Add to Cart' },
      'buy_now': { ar: 'اشتر الآن', en: 'Buy Now' },
      'adding': { ar: 'جاري الإضافة...', en: 'Adding...' },
      'quantity_error': { ar: 'يرجى إدخال كمية صحيحة (1-99)', en: 'Please enter a valid quantity (1-99)' },
      'added_to_cart': { ar: 'تم إضافة {quantity} عنصر إلى السلة', en: 'Added {quantity} item(s) to cart' },
      'add_to_cart_error': { ar: 'فشل في إضافة المنتج إلى السلة', en: 'Failed to add to cart' },
    };
    
    return translations[key]?.[isArabic ? 'ar' : 'en'] || key;
  };

  // Get the primary image (first in gallery or imageUrl)
  const primaryImage = product.gallery?.[0] || product.imageUrl;
  
  // Get all images for gallery
  const allImages = product.gallery?.length > 0 ? product.gallery : (product.imageUrl ? [product.imageUrl] : []);

  // Handle add to cart
  const handleAddToCart = async () => {
    if (quantity < 1 || quantity > 99) {
      toast.error(t('quantity_error'));
      return;
    }

    setAddingToCart(true);

    try {
      const response = await fetch(`/api/storefront/${tenantSlug}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          qty: quantity,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        toast.success(t('added_to_cart').replace('{quantity}', quantity.toString()));
        setQuantity(1); // Reset quantity
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        toast.error(data.error || t('add_to_cart_error'));
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(t('add_to_cart_error'));
    } finally {
      setAddingToCart(false);
    }
  };

  // Handle buy now
  const handleBuyNow = async () => {
    await handleAddToCart();
    if (!addingToCart) {
      // Navigate to checkout after successful add to cart
      window.location.href = `/${tenantSlug}/checkout`;
    }
  };

  // Handle quantity change
  const handleQuantityChange = (newQty: number) => {
    const clampedQty = Math.max(1, Math.min(99, newQty));
    setQuantity(clampedQty);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href={`/${tenantSlug}/retail`} className="hover:text-gray-700 transition-colors">
                Home
              </Link>
            </li>
            {product.categories && product.categories.name && product.categories.slug && (
              <>
                <li>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  <Link 
                    href={`/${tenantSlug}/categories/${product.categories.slug}`} 
                    className="hover:text-gray-700 transition-colors"
                  >
                    {product.categories.name}
                  </Link>
                </li>
              </>
            )}
            <li>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li className="text-gray-900 font-medium">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Product Images */}
          <div className="flex gap-4">
            {/* Thumbnail Images - Vertical Stack */}
            {allImages.length > 1 && (
              <div className="flex flex-col space-y-2 w-20 flex-shrink-0">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    className="aspect-square bg-white rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Product Image */}
            <div className="flex-1">
              <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm">{t('no_image')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            {/* Product Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.title}
              </h1>
              
              {/* Price */}
              <div className="mb-6">
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="text-xl text-gray-400 line-through mb-2">
                    KWD {product.compareAtPrice.toFixed(2)}
                  </div>
                )}
                <div className="text-3xl font-bold text-gray-900">
                  KWD {product.price.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed text-lg">
                  {product.description}
                </p>
              </div>
            )}

            {/* Custom Fields - Product Options */}
            {product.customFields && product.customFields.length > 0 && (
              <div className="space-y-6">
                {product.customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                      {field.title}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {field.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedCustomFields(prev => ({
                            ...prev,
                            [field.id]: option
                          }))}
                          className={`px-6 py-3 text-sm font-medium border-2 rounded-lg transition-all duration-200 ${
                            selectedCustomFields[field.id] === option
                              ? 'border-gray-900 bg-gray-900 text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-900 uppercase tracking-wide">
                {t('quantity')}
              </label>
              <div className="flex items-center w-fit">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="h-12 w-12 rounded-r-none border-r-0 hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="h-12 w-20 text-center rounded-none border-x-0 focus:ring-0 text-lg font-medium"
                  min="1"
                  max="99"
                />
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= 99}
                  className="h-12 w-12 rounded-l-none border-l-0 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-lg rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    {t('adding')}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-3" />
                    {t('add_to_cart')}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-14 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-lg rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                onClick={handleBuyNow}
                disabled={addingToCart}
              >
                {t('buy_now')}
              </Button>
            </div>

            {/* Extra Info */}
            <div className="pt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                {/* SKU */}
                {product.sku && (
                  <div>
                    <span className="text-gray-500 font-medium">SKU:</span>
                    <span className="ml-2 text-gray-900">{product.sku}</span>
                  </div>
                )}
                
                {/* Category */}
                {product.categories && (
                  <div>
                    <span className="text-gray-500 font-medium">Category:</span>
                    <Link 
                      href={`/${tenantSlug}/categories/${product.categories.slug}`}
                      className="ml-2 text-gray-900 hover:text-gray-600 transition-colors"
                    >
                      {product.categories.name}
                    </Link>
                  </div>
                )}
                
                {/* WhatsApp Share */}
                <div className="sm:col-span-2 flex items-center">
                  <span className="text-gray-500 font-medium mr-4">{t('share')}</span>
                  <a
                    href={`https://wa.me/?text=Check out this product: ${product.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white hover:bg-green-600 transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
                    aria-label="Share on WhatsApp"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
