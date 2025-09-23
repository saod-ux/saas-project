"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  ShoppingCart, 
  Palette, 
  Settings, 
  ExternalLink,
  Store
} from "lucide-react";

interface AdminNavigationProps {
  tenantSlug: string;
  tenantName: string;
  logoUrl?: string | null;
}

export default function AdminNavigation({ tenantSlug, tenantName, logoUrl }: AdminNavigationProps) {
  const pathname = usePathname();

  const navigationItems = [
    { 
      section: "الرئيسية", 
      items: [
        { label: "لوحة التحكم", path: "overview", icon: LayoutDashboard, description: "نظرة عامة على المتجر" },
      ]
    },
    { 
      section: "إدارة المحتوى", 
      items: [
        { label: "المنتجات", path: "products", icon: Package, description: "إدارة منتجاتك" },
        { label: "الفئات", path: "categories", icon: FolderOpen, description: "تنظيم فئات المنتجات" },
      ]
    },
    { 
      section: "المبيعات", 
      items: [
        { label: "الطلبات", path: "orders", icon: ShoppingCart, description: "إدارة الطلبات والمبيعات" },
      ]
    },
    { 
      section: "التخصيص", 
      items: [
        { label: "المظهر", path: "appearance", icon: Palette, description: "تخصيص مظهر المتجر" },
        { label: "الإعدادات", path: "settings", icon: Settings, description: "إعدادات المتجر العامة" },
      ]
    },
  ];

  return (
    <aside className="h-full w-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={tenantName} 
                className="w-full h-full object-contain"
              />
            ) : (
              <Store className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">{tenantName}</h1>
            <p className="text-xs text-gray-500">لوحة التحكم</p>
          </div>
        </div>
      </div>

          {/* Navigation */}
          <nav className="p-4 space-y-6">
            {navigationItems.map(({ section, items }) => (
              <div key={section} className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-3">
                  {section}
                </h3>
                <div className="space-y-1">
                  {items.map(({ label, path, icon: Icon, description }) => {
                    const isActive = pathname === `/admin/${tenantSlug}/${path}`;
                    return (
                      <Link
                        key={path}
                        href={`/admin/${tenantSlug}/${path}`}
                        className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{label}</span>
                          <p className={`text-xs mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                            {description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

      {/* Store Preview */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <Link
          href={`/${tenantSlug}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors group"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="font-medium">عرض المتجر</span>
        </Link>
        
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs text-blue-800 font-medium mb-1">💡 نصيحة</div>
          <div className="text-xs text-blue-700">
            يمكنك طلب صفحات مخصصة (حول، الأسئلة الشائعة) من فريق الدعم
          </div>
        </div>
      </div>
    </aside>
  );
}
