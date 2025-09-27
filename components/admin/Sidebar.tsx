'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutGrid, 
  Package, 
  Receipt, 
  Tag, 
  Settings 
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

const navItems = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/admin/overview',
    icon: LayoutGrid
  },
  {
    id: 'catalog',
    label: 'Catalog',
    href: '/admin/catalog',
    icon: Package
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/admin/orders',
    icon: Receipt
  },
  {
    id: 'discounts',
    label: 'Discounts',
    href: '/admin/discounts',
    icon: Tag
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings
  }
]

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <div className={`w-64 bg-white border-r border-border ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-ink">Store Admin</h2>
      </div>
      
      <nav className="px-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-muted hover:bg-gray-50 hover:text-ink'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}













