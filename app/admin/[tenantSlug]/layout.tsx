import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  Tag,
  BarChart3,
  FileText
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: { tenantSlug: string };
}

const navigation = [
  { name: 'Overview', href: 'overview', icon: LayoutDashboard },
  { name: 'Products', href: 'products', icon: Package },
  { name: 'Orders', href: 'orders', icon: ShoppingCart },
  { name: 'Customers', href: 'customers', icon: Users },
  { name: 'Coupons', href: 'coupons', icon: Tag },
  { name: 'Analytics', href: 'analytics', icon: BarChart3 },
  { name: 'Settings', href: 'settings', icon: Settings },
];

export default function AdminLayout({ children, params }: AdminLayoutProps) {
  const { tenantSlug } = params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b">
            <Link href={`/admin/${tenantSlug}/overview`} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = false; // This would be determined by the current pathname
              return (
                <Link
                  key={item.name}
                  href={`/admin/${tenantSlug}/${item.href}`}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {children}
      </div>
    </div>
  );
}

