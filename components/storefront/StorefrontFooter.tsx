"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Instagram, MessageCircle, Music, Camera } from "lucide-react";

interface StorefrontFooterProps {
  tenant: any;
  tenantSlug: string;
  platformContent?: any;
}

export default function StorefrontFooter({ tenant, tenantSlug, platformContent }: StorefrontFooterProps) {
  const { language } = useLanguage();

  const t = (key: string) => {
    const translations: Record<string, { ar: string; en: string }> = {
      'store_description': { ar: 'متجرك الموثوق للمنتجات عالية الجودة والخدمة الاستثنائية.', en: 'Your trusted online store for quality products and exceptional service.' },
      'quick_links': { ar: 'روابط سريعة', en: 'Quick Links' },
      'home': { ar: 'الرئيسية', en: 'Home' },
      'categories': { ar: 'الفئات', en: 'Categories' },
      'search': { ar: 'البحث', en: 'Search' },
      'cart': { ar: 'السلة', en: 'Cart' },
      'returns': { ar: 'الإرجاع', en: 'Returns' },
      'terms': { ar: 'الشروط', en: 'Terms' },
      'follow_us': { ar: 'تابعنا', en: 'Follow Us' },
      'all_rights_reserved': { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
    };
    return translations[key]?.[language] || key;
  };

  // Get social links from tenant settings
  const socialLinks = tenant.settings?.social || {};

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">{tenant.name || tenantSlug}</h3>
            <p className="text-gray-300 mb-4">
              {t('store_description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-md font-semibold mb-4">{t('quick_links')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href={`/${tenantSlug}`} className="text-gray-300 hover:text-white">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link href={`/${tenantSlug}/categories`} className="text-gray-300 hover:text-white">
                  {t('categories')}
                </Link>
              </li>
              <li>
                <Link href={`/${tenantSlug}/cart`} className="text-gray-300 hover:text-white">
                  {t('cart')}
                </Link>
              </li>
              <li>
                <Link href={`/${tenantSlug}/returns`} className="text-gray-300 hover:text-white">
                  {t('returns')}
                </Link>
              </li>
              <li>
                <Link href={`/${tenantSlug}/terms`} className="text-gray-300 hover:text-white">
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          {Object.keys(socialLinks).length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-4">{t('follow_us')}</h4>
              <div className="flex space-x-4">
                {socialLinks.instagram && (
                  <a 
                    href={socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a 
                    href={socialLinks.whatsapp} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a 
                    href={socialLinks.tiktok} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                    title="TikTok"
                  >
                    <Music className="w-6 h-6" />
                  </a>
                )}
                {socialLinks.snapchat && (
                  <a 
                    href={socialLinks.snapchat} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                    title="Snapchat"
                  >
                    <Camera className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 {tenant.name || tenantSlug}. {t('all_rights_reserved')}.</p>
        </div>
      </div>
    </footer>
  );
}
