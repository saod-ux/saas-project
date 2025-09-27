'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Minus, Loader2 } from 'lucide-react';
import { formatKWD } from '@/lib/formatPrice';
import { toast } from 'sonner';
import Link from 'next/link';

interface AdminOrderCreateProps {
  tenant: any;
}

interface OrderItem {
  productId: string;
  name: string;
  nameAr?: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export function AdminOrderCreate({ tenant }: AdminOrderCreateProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Kuwait',
    phone: '',
    email: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [notes, setNotes] = useState('');

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = 5; // Fixed shipping cost for now
  const taxRate = 0.05; // 5% tax rate
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      productId: '',
      name: '',
      nameAr: '',
      sku: '',
      price: 0,
      quantity: 1,
      image: '',
    }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch(`/api/admin/${tenant.slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Order created successfully!');
      queryClient.invalidateQueries({ queryKey: ['adminOrders', tenant.slug] });
      // Redirect to order detail page
      window.location.href = `/admin/${tenant.slug}/orders/${data.data.id}`;
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    // Validate required fields
    if (!shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city) {
      toast.error('Please fill in all required shipping address fields');
      return;
    }

    const orderData = {
      customerId: 'admin-created', // This should be a real customer ID in a real scenario
      customerEmail: shippingAddress.email || 'admin@example.com',
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        nameAr: item.nameAr,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        image: item.image,
      })),
      subtotal,
      taxAmount,
      shippingCost,
      discountAmount: 0,
      total,
      shippingAddress,
      billingAddress: shippingAddress, // Same as shipping for now
      paymentInfo: {
        method: paymentMethod,
        amount: total,
        currency: 'KWD',
        status: 'PENDING',
      },
      shipping: {
        method: 'Standard Shipping',
        cost: shippingCost,
        estimatedDays: 3,
      },
      notes,
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/${tenant.slug}/orders`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-gray-600">Manually create an order for a customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Add products to this order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`productId-${index}`}>Product ID</Label>
                      <Input
                        id={`productId-${index}`}
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        placeholder="Enter product ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`sku-${index}`}>SKU</Label>
                      <Input
                        id={`sku-${index}`}
                        value={item.sku}
                        onChange={(e) => updateItem(index, 'sku', e.target.value)}
                        placeholder="Enter SKU"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`name-${index}`}>Product Name</Label>
                      <Input
                        id={`name-${index}`}
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`nameAr-${index}`}>Product Name (Arabic)</Label>
                      <Input
                        id={`nameAr-${index}`}
                        value={item.nameAr}
                        onChange={(e) => updateItem(index, 'nameAr', e.target.value)}
                        placeholder="Enter product name in Arabic"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`price-${index}`}>Price</Label>
                      <Input
                        id={`price-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`total-${index}`}>Total</Label>
                      <Input
                        id={`total-${index}`}
                        value={formatKWD(item.price * item.quantity)}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`image-${index}`}>Image URL</Label>
                    <Input
                      id={`image-${index}`}
                      value={item.image}
                      onChange={(e) => updateItem(index, 'image', e.target.value)}
                      placeholder="Enter image URL"
                    />
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={shippingAddress.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  value={shippingAddress.addressLine1}
                  onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={shippingAddress.addressLine2}
                  onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    value={shippingAddress.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={shippingAddress.country}
                    onValueChange={(value) => handleInputChange('country', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kuwait">Kuwait</SelectItem>
                      <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                      <SelectItem value="UAE">UAE</SelectItem>
                      <SelectItem value="Qatar">Qatar</SelectItem>
                      <SelectItem value="Bahrain">Bahrain</SelectItem>
                      <SelectItem value="Oman">Oman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
              <CardDescription>Add any special instructions for this order</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm">{formatKWD(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatKWD(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>{formatKWD(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatKWD(shippingCost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatKWD(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createOrderMutation.isPending}
                size="lg"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  'Create Order'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

