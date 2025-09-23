"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Store, 
  Globe, 
  Users, 
  CreditCard, 
  Settings, 
  HelpCircle,
  BarChart3,
  Search,
  Monitor
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/admin/platform", icon: LayoutDashboard },
  { name: "Merchants", href: "/admin/platform/merchants", icon: Store },
  { name: "Domains", href: "/admin/platform/domains", icon: Globe },
  { name: "SEO Management", href: "/admin/platform/seo", icon: Search },
  // Hidden non-MVP features: Users, Billing, Analytics, Settings, Support
];

export default function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

