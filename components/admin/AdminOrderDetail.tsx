'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Package, MapPin, CreditCard, Calendar, Save, Loader2 } from 'lucide-react';
import { formatKWD } from '@/lib/formatPrice';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface AdminOrderDetailProps {
  tenant: any;
  orderId: string;
}

export function AdminOrderDetail({ tenant, orderId }: AdminOrderDetailProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['adminOrder', tenant.slug, orderId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/${tenant.slug}/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      setSelectedStatus(data.status);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/admin/${tenant.slug}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Order status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['adminOrder', tenant.slug, orderId] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders', tenant.slug] });
    },
    onError: (err) => {
      toast.error(err.message);
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

  const handleStatusUpdate = () => {
    if (selectedStatus && selectedStatus !== order.status) {
      updateStatusMutation.mutate(selectedStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading order details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading order</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order not found</h3>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
          <Link href={`/admin/${tenant.slug}/orders`}>
            <Button>
              Back to Orders
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/${tenant.slug}/orders`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-600">Order ID: {order.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
          <div className="text-right">
            <p className="font-semibold text-lg">{formatKWD(order.total)}</p>
            <p className="text-sm text-gray-600">{order.paymentInfo.currency}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.sku && <p className="text-sm text-gray-600">SKU: {item.sku}</p>}
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatKWD(item.price)}</p>
                      <p className="text-sm text-gray-600">each</p>
                      <p className="font-medium text-lg">{formatKWD(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Shipping Address</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                    {order.shippingAddress.email && <p>Email: {order.shippingAddress.email}</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Billing Address</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium">{order.billingAddress?.fullName || order.shippingAddress.fullName}</p>
                    <p>{order.billingAddress?.addressLine1 || order.shippingAddress.addressLine1}</p>
                    {(order.billingAddress?.addressLine2 || order.shippingAddress.addressLine2) && (
                      <p>{order.billingAddress?.addressLine2 || order.shippingAddress.addressLine2}</p>
                    )}
                    <p>{order.billingAddress?.city || order.shippingAddress.city}, {order.billingAddress?.state || order.shippingAddress.state} {order.billingAddress?.postalCode || order.shippingAddress.postalCode}</p>
                    <p>{order.billingAddress?.country || order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Current Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending || selectedStatus === order.status}
                className="w-full"
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Method</span>
                <span className="font-medium">{order.paymentInfo.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getPaymentStatusColor(order.paymentInfo.status)}>
                  {order.paymentInfo.status}
                </Badge>
              </div>
              {order.paymentInfo.transactionId && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transaction ID</span>
                  <span className="font-mono text-sm">{order.paymentInfo.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="font-medium">{formatKWD(order.paymentInfo.amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span>{formatKWD(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="text-sm">Discount</span>
                  <span>-{formatKWD(order.discountAmount)}</span>
                </div>
              )}
              {order.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <span>{formatKWD(order.shippingCost)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span>{formatKWD(order.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatKWD(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Order Placed</p>
                    <p className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-sm">Last Updated</p>
                      <p className="text-xs text-gray-600">{new Date(order.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

