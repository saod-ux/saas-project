'use client';

import { useState, useEffect } from 'react';
import { useCustomer } from '@/contexts/CustomerContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, ShoppingBag, LogOut, Package, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      currency: string;
      images: string[];
    };
  }>;
}

interface CustomerAccountProps {
  tenantSlug: string;
}

export default function CustomerAccount({ tenantSlug }: CustomerAccountProps) {
  const { customer, logout } = useCustomer();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (customer) {
      fetchOrders();
    }
  }, [customer, tenantSlug]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const response = await fetch(`/api/storefront/${tenantSlug}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          setOrders(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
            <p className="text-gray-600">You need to be signed in to view your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Customer Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>{customer.name || 'Customer'}</CardTitle>
                <CardDescription>{customer.email}</CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <ShoppingBag className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Package className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <div className="text-2xl font-bold">
                {orders.filter(order => order.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CreditCard className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <div className="text-2xl font-bold">
                {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order History
          </CardTitle>
          <CardDescription>Your recent orders and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-gray-600">Start shopping to see your orders here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Order #{order.orderNumber}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {order.currency} {order.total.toFixed(2)}
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.product.images && item.product.images.length > 0 && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × {item.product.currency} {item.product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

