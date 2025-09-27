'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Calendar, MapPin, CreditCard, Eye, Loader2 } from 'lucide-react';
import { formatKWD } from '@/lib/formatPrice';
import Link from 'next/link';

interface CustomerOrdersProps {
  tenant: any;
}

export function CustomerOrders({ tenant }: CustomerOrdersProps) {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['customerOrders', tenant.slug],
    queryFn: async () => {
      const response = await fetch(`/api/storefront/${tenant.slug}/orders`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const result = await response.json();
      return result.data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading your orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading orders</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-4">You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <Link href={`/${tenant.slug}`}>
              <Button>
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Orders</h1>
        <p className="text-gray-600">Track and manage your orders</p>
      </div>

      <div className="space-y-4">
        {orders.map((order: any) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatKWD(order.total)}</p>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Order Items Preview */}
                <div>
                  <h4 className="font-medium mb-2">Items</h4>
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">{formatKWD(item.price * item.quantity)}</p>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-600">
                        +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Shipping Address
                    </h4>
                    <div className="text-sm text-gray-600">
                      <p>{order.shippingAddress.fullName}</p>
                      <p>{order.shippingAddress.addressLine1}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment
                    </h4>
                    <div className="text-sm text-gray-600">
                      <p>{order.paymentInfo.method}</p>
                      <Badge className={getPaymentStatusColor(order.paymentInfo.status)}>
                        {order.paymentInfo.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  <Link href={`/${tenant.slug}/orders/${order.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

