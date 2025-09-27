import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Copy, Eye } from 'lucide-react';
import Link from 'next/link';

interface CouponsPageProps {
  params: { tenantSlug: string };
}

export default function CouponsPage({ params }: CouponsPageProps) {
  const { tenantSlug } = params;

  // Mock data for now
  const coupons = [
    {
      id: '1',
      code: 'WELCOME10',
      name: 'Welcome Discount',
      type: 'percentage',
      value: 10,
      status: 'active',
      usageCount: 45,
      usageLimit: 100,
      expiresAt: '2024-12-31',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      code: 'FREESHIP',
      name: 'Free Shipping',
      type: 'fixed',
      value: 0,
      status: 'active',
      usageCount: 23,
      usageLimit: 50,
      expiresAt: '2024-11-30',
      createdAt: '2024-02-01'
    },
    {
      id: '3',
      code: 'SAVE20',
      name: 'Save 20%',
      type: 'percentage',
      value: 20,
      status: 'expired',
      usageCount: 15,
      usageLimit: 25,
      expiresAt: '2024-01-31',
      createdAt: '2023-12-01'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string, value: number) => {
    if (type === 'percentage') {
      return `${value}% off`;
    } else if (type === 'fixed') {
      return value === 0 ? 'Free shipping' : `KWD ${value} off`;
    }
    return type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
            <p className="text-gray-600 mt-2">Manage discount codes and promotions</p>
          </div>
          <Link href={`/admin/${tenantSlug}/coupons/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Coupons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KWD 2,450</div>
            </CardContent>
          </Card>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons</CardTitle>
            <CardDescription>Manage your discount codes and promotions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Discount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Usage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Expires</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {coupon.code}
                          </code>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{coupon.name}</td>
                      <td className="py-3 px-4">
                        {getTypeLabel(coupon.type, coupon.value)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div>{coupon.usageCount} / {coupon.usageLimit}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(coupon.usageCount / coupon.usageLimit) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(coupon.status)}>
                          {coupon.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {coupon.expiresAt}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

