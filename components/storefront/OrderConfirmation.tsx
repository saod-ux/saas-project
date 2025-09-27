'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, MapPin, CreditCard, Calendar, ArrowLeft } from 'lucide-react';
import { formatKWD } from '@/lib/formatPrice';
import Link from 'next/link';

interface OrderConfirmationProps {
  order: any;
  tenant: any;
}

export function OrderConfirmation({ order, tenant }: OrderConfirmationProps) {
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

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">
          Thank you for your order. We've received your order and will process it shortly.
        </p>
      </div>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Details</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Order #{order.orderNumber} • Placed on {new Date(order.createdAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Shipping Address
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Information
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Method: {order.paymentInfo.method}</p>
                <p>Status: <Badge className={getPaymentStatusColor(order.paymentInfo.status)}>{order.paymentInfo.status}</Badge></p>
                {order.paymentInfo.transactionId && <p>Transaction ID: {order.paymentInfo.transactionId}</p>}
                <p>Amount: {formatKWD(order.paymentInfo.amount)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Totals */}
          <div>
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatKWD(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatKWD(order.discountAmount)}</span>
                </div>
              )}
              {order.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatKWD(order.shippingCost)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatKWD(order.taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatKWD(order.total)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Order Notes</h3>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            What's Next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium">Order Confirmation</p>
                <p className="text-sm text-gray-600">We've received your order and will send you a confirmation email shortly.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium">Processing</p>
                <p className="text-sm text-gray-600">We'll prepare your order for shipment within 1-2 business days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium">Shipping</p>
                <p className="text-sm text-gray-600">You'll receive tracking information once your order ships.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-sm text-gray-600">Your order will be delivered within 3-5 business days.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href={`/${tenant.slug}`}>
          <Button variant="outline" className="w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>
        <Link href={`/${tenant.slug}/orders`}>
          <Button className="w-full sm:w-auto">
            <Package className="w-4 h-4 mr-2" />
            View All Orders
          </Button>
        </Link>
      </div>
    </div>
  );
}

