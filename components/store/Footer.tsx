"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Facebook, Instagram, Twitter, Youtube, Phone, MapPin, Globe } from "lucide-react";
import { FaWhatsapp, FaTiktok, FaSnapchat } from "react-icons/fa";

interface FooterProps {
  tenantSlug: string;
  tenant?: {
    settings?: {
      social?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
        whatsapp?: string;
        tiktok?: string;
        snapchat?: string;
        website?: string;
      };
    };
  };
  platformContent?: {
    policies?: {
      returnPolicy?: {
        enabled: boolean;
        title: string;
        content: string;
      };
      aboutUs?: {
        enabled: boolean;
        title: string;
        content: string;
      };
    };
  };
}

export default function Footer({ tenantSlug, tenant, platformContent }: FooterProps) {
  const [lang, setLang] = useState<"ar" | "en">("ar");

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem("lang") as "ar" | "en" | null;
    if (stored) {
      setLang(stored);
    }
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("lang") as "ar" | "en" | null;
      if (stored) {
        setLang(stored);
      }
    };

    // Also listen for custom language change events
    const handleLanguageChange = () => {
      const stored = localStorage.getItem("lang") as "ar" | "en" | null;
      if (stored) {
        setLang(stored);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("languageChanged", handleLanguageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("languageChanged", handleLanguageChange);
    };
  }, []);

  // Helper function to format URLs properly
  const formatUrl = (url: string | undefined, platform: string): string | null => {
    if (!url || url.trim() === '') return null;
    
    let formattedUrl = url.trim();
    
    // Fix backslashes to forward slashes
    formattedUrl = formattedUrl.replace(/\\/g, '/');
    
    // Add https:// if not present
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      // Handle special cases for different platforms
      if (platform === 'whatsapp') {
        // WhatsApp URLs should start with https://wa.me/
        if (!formattedUrl.startsWith('wa.me/') && !formattedUrl.startsWith('+')) {
          formattedUrl = `https://wa.me/${formattedUrl}`;
        } else if (formattedUrl.startsWith('+')) {
          formattedUrl = `https://wa.me/${formattedUrl}`;
        } else if (!formattedUrl.startsWith('wa.me/')) {
          formattedUrl = `https://wa.me/${formattedUrl}`;
        } else {
          formattedUrl = `https://${formattedUrl}`;
        }
      } else if (platform === 'instagram') {
        // Instagram URLs should start with https://instagram.com/
        // Remove www.instagram.com/ prefix if present
        if (formattedUrl.startsWith('www.instagram.com/')) {
          formattedUrl = formattedUrl.replace('www.instagram.com/', '');
        }
        if (formattedUrl.startsWith('instagram.com/')) {
          formattedUrl = formattedUrl.replace('instagram.com/', '');
        }
        formattedUrl = `https://instagram.com/${formattedUrl}`;
      } else if (platform === 'tiktok') {
        // TikTok URLs should start with https://tiktok.com/@username
        // Remove www.tiktok.com prefix if present
        if (formattedUrl.startsWith('www.tiktok.com')) {
          formattedUrl = formattedUrl.replace('www.tiktok.com', '');
        }
        if (formattedUrl.startsWith('tiktok.com')) {
          formattedUrl = formattedUrl.replace('tiktok.com', '');
        }
        // Add @ if not present
        if (!formattedUrl.startsWith('@')) {
          formattedUrl = `@${formattedUrl}`;
        }
        formattedUrl = `https://tiktok.com/${formattedUrl}`;
      } else if (platform === 'snapchat') {
        // Snapchat URLs should start with https://snapchat.com/add/username
        if (formattedUrl.startsWith('snapchat.com')) {
          formattedUrl = formattedUrl.replace('snapchat.com', '');
        }
        // Remove leading slash if present
        if (formattedUrl.startsWith('/')) {
          formattedUrl = formattedUrl.substring(1);
        }
        formattedUrl = `https://snapchat.com/add/${formattedUrl}`;
      } else {
        // Default: add https://
        formattedUrl = `https://${formattedUrl}`;
      }
    }
    
    return formattedUrl;
  };

  // Helper function to get social media URL with proper fallback logic
  const getSocialUrl = (platform: string) => {
    const tenantUrl = tenant?.settings?.social?.[platform as keyof typeof tenant.settings.social] || 
                     tenant?.settingsJson?.social?.[platform as keyof typeof tenant.settingsJson.social];
    
    // If tenant has a URL (even if empty), use it (formatUrl will return null for empty strings)
    if (tenantUrl !== undefined) {
      return formatUrl(tenantUrl, platform);
    }
    
    // Only fallback to env vars if tenant setting doesn't exist at all
    return process.env[`NEXT_PUBLIC_${platform.toUpperCase()}_URL` as keyof typeof process.env] as string || null;
  };

  // Social media URLs from tenant settings or fallback to env vars
  const socialLinks = {
    instagram: getSocialUrl('instagram'),
    whatsapp: getSocialUrl('whatsapp'),
    tiktok: getSocialUrl('tiktok'),
    snapchat: getSocialUrl('snapchat'),
  };

  const translations = {
    ar: {
      store: "المتجر",
      shop: "التسوق",
      social: "تابعنا",
      contact: "اتصل بنا",
      about: "من نحن",
      faq: "الأسئلة الشائعة",
      privacy: "سياسة الخصوصية",
      home: "الرئيسية",
      search: "ابحث",
      cart: "السلة",
      poweredBy: "بدعم من",
      eview: "E-view",
    },
    en: {
      store: "Store",
      shop: "Shop",
      social: "Follow Us",
      contact: "Contact",
      about: "About",
      faq: "FAQ",
      privacy: "Privacy Policy",
      home: "Home",
      search: "Search",
      cart: "Cart",
      poweredBy: "Powered by",
      eview: "E-view",
    },
  };

  const t = (key: string) => (translations[lang] as any)[key] ?? key;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Store Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-6">{t("store")}</h3>
              <div className="space-y-4 text-gray-300">
                <Link href={`/${tenantSlug}/retail`} className="block hover:text-white transition-colors duration-200">
                  {t("home")}
                </Link>
                <Link href={`/${tenantSlug}/categories`} className="block hover:text-white transition-colors duration-200">
                  {t("categories")}
                </Link>
                <Link href={`/${tenantSlug}/search`} className="block hover:text-white transition-colors duration-200">
                  {t("search")}
                </Link>
                {platformContent?.policies?.aboutUs?.enabled && (
                  <Link href={`/${tenantSlug}/about`} className="block hover:text-white transition-colors duration-200">
                    {t("about")}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-6">{lang === 'ar' ? 'خدمة العملاء' : 'Customer Service'}</h3>
              <div className="space-y-4 text-gray-300">
                <Link href={`/${tenantSlug}/contact`} className="block hover:text-white transition-colors duration-200">
                  {t("contact")}
                </Link>
                <Link href={`/${tenantSlug}/shipping`} className="block hover:text-white transition-colors duration-200">
                  {lang === 'ar' ? 'معلومات الشحن' : 'Shipping Info'}
                </Link>
                {platformContent?.policies?.returnPolicy?.enabled && (
                <Link href={`/${tenantSlug}/policies/return`} className="block hover:text-white transition-colors duration-200">
                    {lang === 'ar' ? 'الإرجاع' : 'Returns'}
                  </Link>
                )}
                <Link href={`/${tenantSlug}/faq`} className="block hover:text-white transition-colors duration-200">
                  {t("faq")}
                </Link>
              </div>
            </div>
          </div>

          {/* Follow Us */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-6">{t("social")}</h3>
              <div className="flex space-x-4">
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-pink-600 transition-all duration-200 hover:scale-110"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a
                    href={socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-green-600 transition-all duration-200 hover:scale-110"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-black transition-all duration-200 hover:scale-110"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                  </a>
                )}
                {socialLinks.snapchat && (
                  <a
                    href={socialLinks.snapchat}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Snapchat"
                    className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-yellow-500 transition-all duration-200 hover:scale-110"
                  >
                    <FaSnapchat className="h-6 w-6" />
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-6">
                {lang === 'ar' ? 'تابع أحدث المنتجات والعروض' : 'Stay updated with our latest products and offers'}
              </p>
            </div>
          </div>

          {/* Language & Newsletter */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-6">{lang === 'ar' ? 'اللغة' : 'Language'}</h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => setLang("ar")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    lang === "ar" 
                      ? "bg-white text-gray-900 shadow-lg" 
                      : "bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  العربية
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    lang === "en" 
                      ? "bg-white text-gray-900 shadow-lg" 
                      : "bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6">{lang === 'ar' ? 'النشرة البريدية' : 'Newsletter'}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {lang === 'ar' ? 'اشترك لتصلك التحديثات والعروض الحصرية' : 'Subscribe to get updates on new products and exclusive offers'}
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder={lang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
                <button className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-r-lg hover:bg-gray-100 transition-colors duration-200">
                  {lang === 'ar' ? 'اشترك' : 'Subscribe'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              <p>{lang === 'ar' ? `© ٢٠٢٤ ${tenantSlug}. جميع الحقوق محفوظة.` : `© 2024 ${tenantSlug}. All rights reserved.`}</p>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href={`/${tenantSlug}/privacy`} className="hover:text-white transition-colors duration-200">
                {t("privacy")}
              </Link>
              <Link href={`/${tenantSlug}/terms`} className="hover:text-white transition-colors duration-200">
                {lang === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
              </Link>
              <Link href={`/${tenantSlug}/cookies`} className="hover:text-white transition-colors duration-200">
                {lang === 'ar' ? 'سياسة الكوكيز' : 'Cookie Policy'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}