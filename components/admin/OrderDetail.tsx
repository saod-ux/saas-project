'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  User, 
  MapPin, 
  CreditCard, 
  Truck, 
  Edit, 
  Save, 
  X,
  Calendar,
  Hash
} from 'lucide-react';
import { formatKWD } from '@/lib/formatPrice';

interface OrderItem {
  productId: string;
  name: string;
  nameAr?: string;
  sku?: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface PaymentInfo {
  method: string;
  provider?: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: string;
  processedAt?: string;
  metadata?: any;
}

interface ShippingInfo {
  method: string;
  cost: number;
  estimatedDays: number;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  tenantId: string;
  customerId: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  payment: PaymentInfo;
  shipping: ShippingInfo;
  notes?: string;
  internalNotes?: string;
  tags: string[];
  metadata?: any;
}

interface OrderDetailProps {
  tenantSlug: string;
  orderId: string;
}

export default function OrderDetail({ tenantSlug, orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Order>>({});
  const [saving, setSaving] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/${tenantSlug}/orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      setOrder(data.order);
      setEditData(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [tenantSlug, orderId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/${tenantSlug}/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order');
      }

      setOrder(data.order);
      setEditData(data.order);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(order || {});
    setEditing(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'paid': return 'default';
      case 'processing': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'paid': return 'Paid';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      case 'refunded': return 'Refunded';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error || 'Order not found'}</p>
            <Button onClick={fetchOrder} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(order.createdAt)}
            </div>
            <div className="flex items-center gap-1">
              <Hash className="w-4 h-4" />
              {order.id}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
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
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
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
                      {item.nameAr && (
                        <p className="text-sm text-gray-600">{item.nameAr}</p>
                      )}
                      {item.sku && (
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatKWD(item.total)}</p>
                      <p className="text-sm text-gray-600">
                        {formatKWD(item.price)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && (
                  <p>{order.shippingAddress.company}</p>
                )}
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p>{order.shippingAddress.address2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{order.customerEmail}</p>
                {order.customerPhone && (
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                )}
                <p className="text-sm text-gray-500">ID: {order.customerId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatKWD(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatKWD(order.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatKWD(order.shippingCost)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatKWD(order.discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatKWD(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="capitalize">{order.payment.method.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span>{formatKWD(order.payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant={order.payment.status === 'completed' ? 'default' : 'secondary'}>
                    {order.payment.status}
                  </Badge>
                </div>
                {order.payment.transactionId && (
                  <div className="flex justify-between">
                    <span>Transaction ID</span>
                    <span className="text-sm font-mono">{order.payment.transactionId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Method</span>
                  <span>{order.shipping.method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost</span>
                  <span>{formatKWD(order.shipping.cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est. Delivery</span>
                  <span>{order.shipping.estimatedDays} days</span>
                </div>
                {order.shipping.trackingNumber && (
                  <div className="flex justify-between">
                    <span>Tracking</span>
                    <span className="text-sm font-mono">{order.shipping.trackingNumber}</span>
                  </div>
                )}
                {order.shipping.carrier && (
                  <div className="flex justify-between">
                    <span>Carrier</span>
                    <span>{order.shipping.carrier}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Management */}
          {editing && (
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select
                    value={editData.status || order.status}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tracking Number</label>
                  <Input
                    value={editData.shipping?.trackingNumber || order.shipping.trackingNumber || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, trackingNumber: e.target.value }
                    }))}
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Internal Notes</label>
                  <Textarea
                    value={editData.internalNotes || order.internalNotes || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, internalNotes: e.target.value }))}
                    placeholder="Add internal notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

