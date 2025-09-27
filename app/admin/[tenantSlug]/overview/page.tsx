import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Plus,
  Eye,
  Settings
} from 'lucide-react';
import Link from 'next/link';

interface AdminOverviewProps {
  params: { tenantSlug: string };
}

export default function AdminOverview({ params }: AdminOverviewProps) {
  const { tenantSlug } = params;

  const stats = [
    {
      title: 'Total Products',
      value: '24',
      change: '+12%',
      icon: Package,
      href: `/admin/${tenantSlug}/products`
    },
    {
      title: 'Orders',
      value: '156',
      change: '+8%',
      icon: ShoppingCart,
      href: `/admin/${tenantSlug}/orders`
    },
    {
      title: 'Customers',
      value: '89',
      change: '+15%',
      icon: Users,
      href: `/admin/${tenantSlug}/customers`
    },
    {
      title: 'Revenue',
      value: 'KWD 2,450',
      change: '+23%',
      icon: TrendingUp,
      href: `/admin/${tenantSlug}/analytics`
    }
  ];

  const quickActions = [
    {
      title: 'Add Product',
      description: 'Create a new product',
      icon: Plus,
      href: `/admin/${tenantSlug}/products/new`
    },
    {
      title: 'View Orders',
      description: 'Manage customer orders',
      icon: Eye,
      href: `/admin/${tenantSlug}/orders`
    },
    {
      title: 'Store Settings',
      description: 'Configure your store',
      icon: Settings,
      href: `/admin/${tenantSlug}/settings`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your store admin panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link key={index} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-green-600">{stat.change} from last month</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <action.icon className="h-5 w-5" />
                    <span>{action.title}</span>
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New order received</p>
                    <p className="text-xs text-gray-500">Order #12345 - 2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Product updated</p>
                    <p className="text-xs text-gray-500">iPhone 15 Pro - 1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Low stock alert</p>
                    <p className="text-xs text-gray-500">MacBook Air - 3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

