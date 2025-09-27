"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/stores/cart";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface StorefrontHeaderProps {
  tenant: any;
  tenantSlug: string;
}

export default function StorefrontHeader({ tenant, tenantSlug }: StorefrontHeaderProps) {
  const { language, setLanguage, isRTL, isHydrated } = useLanguage();
  const { getTotalItems } = useCartStore();
  const [isClientHydrated, setIsClientHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    setIsClientHydrated(true);
    
    // Check if customer is authenticated by looking for auth cookies
    const checkAuth = () => {
      // Check for customer authentication cookies
      const customerToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('customer_token='));
      const customerEmail = document.cookie
        .split('; ')
        .find(row => row.startsWith('customer_email='));
      
      if (customerToken && customerEmail) {
        setIsAuthenticated(true);
        setCustomerEmail(customerEmail.split('=')[1]);
      }
    };
    
    checkAuth();
  }, []);

  const handleLogout = () => {
    // Clear all customer auth cookies
    const cookiesToClear = ['customer_token', 'customer_id', 'customer_email', 'tenant_id', 'tenant_slug'];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Redirect to home page
    window.location.href = `/${tenantSlug}`;
  };

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'home': { ar: 'الرئيسية', en: 'Home' },
      'categories': { ar: 'الفئات', en: 'Categories' },
      'search': { ar: 'البحث', en: 'Search' },
      'cart': { ar: 'السلة', en: 'Cart' },
      'admin': { ar: 'الإدارة', en: 'Admin' },
      'sign_in': { ar: 'تسجيل الدخول', en: 'Sign In' },
      'my_account': { ar: 'حسابي', en: 'My Account' },
      'logout': { ar: 'تسجيل الخروج', en: 'Logout' },
    };
    return translations[key]?.[language] || key;
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${tenantSlug}`} className="flex items-center space-x-3">
            {tenant.logoUrl ? (
              <Image
                src={tenant.logoUrl}
                alt={tenant.name || tenantSlug}
                width={40}
                height={40}
                className="rounded-lg"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-gray-600">
                  {tenantSlug.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xl font-bold text-gray-900">
              {tenant.name || tenantSlug}
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href={`/${tenantSlug}`} className="text-gray-700 hover:text-gray-900">
              {t('home')}
            </Link>
            <Link href={`/${tenantSlug}/categories`} className="text-gray-700 hover:text-gray-900">
              {t('categories')}
            </Link>
            <Link href={`/${tenantSlug}/search`} className="text-gray-700 hover:text-gray-900">
              {t('search')}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>

            {/* Authentication */}
            {isClientHydrated && isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/${tenantSlug}/account`} 
                  className="text-gray-700 hover:text-gray-900 flex items-center space-x-1"
                >
                  <User className="h-4 w-4" />
                  <span>{t('my_account')}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {t('logout')}
                </Button>
              </div>
            ) : (
              <Link href={`/${tenantSlug}/sign-in`} className="text-gray-700 hover:text-gray-900">
                {t('sign_in')}
              </Link>
            )}

            {/* Cart */}
            <Link 
              href={`/${tenantSlug}/cart`} 
              className="relative text-gray-700 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>{t('cart')}</span>
              {isClientHydrated && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {/* Admin */}
            <Link href={`/admin/${tenantSlug}`} className="text-gray-700 hover:text-gray-900">
              {t('admin')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
