"use client";

import { useCartStore } from "@/stores/cart";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface CartClientProps {
  tenant: any;
  tenantSlug: string;
}

export default function CartClient({ tenant, tenantSlug }: CartClientProps) {
  const { language } = useLanguage();
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'shopping_cart': { ar: 'سلة التسوق', en: 'Shopping Cart' },
      'your_cart_is_empty': { ar: 'سلتك فارغة', en: 'Your cart is empty' },
      'continue_shopping': { ar: 'متابعة التسوق', en: 'Continue Shopping' },
      'quantity': { ar: 'الكمية', en: 'Quantity' },
      'price': { ar: 'السعر', en: 'Price' },
      'total': { ar: 'المجموع', en: 'Total' },
      'remove': { ar: 'إزالة', en: 'Remove' },
      'subtotal': { ar: 'المجموع الفرعي', en: 'Subtotal' },
      'proceed_to_checkout': { ar: 'المتابعة للدفع', en: 'Proceed to Checkout' },
      'update_cart': { ar: 'تحديث السلة', en: 'Update Cart' },
    };
    return translations[key]?.[language] || key;
  };

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('shopping_cart')}</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('shopping_cart')}</h1>
          <p className="text-gray-600 mb-8">{t('your_cart_is_empty')}</p>
          <Link 
            href={`/${tenantSlug}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('continue_shopping')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('shopping_cart')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {items.map((item) => (
              <div key={item.id} className="p-6 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.price.toFixed(3)} KWD
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-lg font-medium text-gray-900">
                      {(item.price * item.quantity).toFixed(3)} KWD
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    {t('remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('subtotal')}</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('quantity')}:</span>
                <span className="font-medium">{getTotalItems()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('total')}:</span>
                <span className="text-xl font-bold text-gray-900">
                  {getTotalPrice().toFixed(3)} KWD
                </span>
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4">
              {t('proceed_to_checkout')}
            </button>

            <Link 
              href={`/${tenantSlug}`}
              className="block w-full text-center text-blue-600 hover:text-blue-800 py-2"
            >
              {t('continue_shopping')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

