'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, Clock, XCircle, ArrowLeft, Package } from 'lucide-react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  productId: string
  nameSnapshot: string
  priceSnapshot: number
  quantity: number
  total: number
}

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
  customerName: string
  customerEmail: string
  customerPhone: string
  subtotal: number
  tax: number
  shipping: number
  total: number
  currency: string
  createdAt: string
  orderItems: OrderItem[]
}

export default function OrderPage() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenantSlug as string
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  // Load order data
  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await fetch(`/api/storefront/${tenantSlug}/order/${orderId}`)
        const data = await response.json()
        
        if (data.ok) {
          setOrder(data.data)
        } else {
          toast.error(data.error || 'Order not found')
          router.push(`/${tenantSlug}`)
        }
      } catch (error) {
        console.error('Error loading order:', error)
        toast.error('Failed to load order')
        router.push(`/${tenantSlug}`)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [tenantSlug, orderId, router])

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'SUCCEEDED':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order not found</h1>
          <p className="text-gray-600 mb-4">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push(`/${tenantSlug}`)}>
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${tenantSlug}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Confirmation</h1>
              <p className="text-gray-600 mt-2">Order #{order.orderNumber}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {order.customerName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {order.customerEmail}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {order.customerPhone}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.nameSnapshot}</p>
                        <p className="text-sm text-gray-600">
                          {item.priceSnapshot} KWD × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.total.toFixed(2)} KWD
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{order.subtotal.toFixed(2)} KWD</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{order.tax.toFixed(2)} KWD</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{order.shipping.toFixed(2)} KWD</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{order.total.toFixed(2)} KWD</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <p><span className="font-medium">Order Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                      <p><span className="font-medium">Order Time:</span> {new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {order.status === 'PENDING' && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Your order is being processed. You will receive a confirmation email shortly.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

