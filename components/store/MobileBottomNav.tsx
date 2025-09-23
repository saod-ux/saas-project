"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";

interface MobileBottomNavProps {
  tenantSlug: string;
}

export default function MobileBottomNav({ tenantSlug }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [lang, setLang] = useState<"ar"|"en">("ar");

  const isActive = (href: string) => pathname?.startsWith(href);

  const base = `/${tenantSlug}`;

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem("lang")) as "ar"|"en"|null;
    if (stored) setLang(stored);
    const onChange = () => {
      const s = localStorage.getItem("lang") as "ar"|"en"|null;
      if (s) setLang(s);
    };
    window.addEventListener("languageChanged", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("languageChanged", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const t = (key: string) => {
    const dict: Record<string, Record<string,string>> = {
      ar: { home: "الرئيسية", categories: "الفئات", cart: "السلة", account: "حسابي" },
      en: { home: "Home", categories: "Categories", cart: "Cart", account: "Account" },
    };
    return (dict[lang] && dict[lang][key]) || key;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl grid grid-cols-4">
        <Link href={`${base}/retail`} className="flex flex-col items-center justify-center py-2.5 text-xs">
          <Home className={`h-5 w-5 ${isActive(`${base}/retail`) ? 'text-blue-600' : 'text-gray-600'}`} />
          <span className={`${isActive(`${base}/retail`) ? 'text-blue-600' : 'text-gray-700'}`}>{t("home")}</span>
        </Link>
        <Link href={`${base}/categories`} className="flex flex-col items-center justify-center py-2.5 text-xs">
          <LayoutGrid className={`h-5 w-5 ${isActive(`${base}/categories`) ? 'text-blue-600' : 'text-gray-600'}`} />
          <span className={`${isActive(`${base}/categories`) ? 'text-blue-600' : 'text-gray-700'}`}>{t("categories")}</span>
        </Link>
        {/* Search removed from bottom bar */}
        <Link href={`${base}/cart`} className="flex flex-col items-center justify-center py-2.5 text-xs">
          <ShoppingCart className={`h-5 w-5 ${isActive(`${base}/cart`) ? 'text-blue-600' : 'text-gray-600'}`} />
          <span className={`${isActive(`${base}/cart`) ? 'text-blue-600' : 'text-gray-700'}`}>{t("cart")}</span>
        </Link>
        <Link href={`${base}/account`} className="flex flex-col items-center justify-center py-2.5 text-xs">
          <User className={`h-5 w-5 ${isActive(`${base}/account`) ? 'text-blue-600' : 'text-gray-600'}`} />
          <span className={`${isActive(`${base}/account`) ? 'text-blue-600' : 'text-gray-700'}`}>{t("account")}</span>
        </Link>
      </div>
    </nav>
  );
}


