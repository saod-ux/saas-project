"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  tenantSlug: string;
}

export default function AdminSidebar({ tenantSlug }: AdminSidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: `/admin/${tenantSlug}`, icon: '📊' },
    { name: 'Products', href: `/admin/${tenantSlug}/products`, icon: '📦' },
    { name: 'Categories', href: `/admin/${tenantSlug}/categories`, icon: '📁' },
    { name: 'Orders', href: `/admin/${tenantSlug}/orders`, icon: '🛒' },
    { name: 'Inventory', href: `/admin/${tenantSlug}/inventory`, icon: '📋' },
    { name: 'Customers', href: `/admin/${tenantSlug}/customers`, icon: '👥' },
    { name: 'Settings', href: `/admin/${tenantSlug}/settings`, icon: '⚙️' },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r">
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
