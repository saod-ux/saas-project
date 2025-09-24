'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface CartItem {
  productId: string
  nameSnapshot?: string
  priceSnapshot?: number
  qty: number
}

interface CartData {
  items: CartItem[]
  subtotal: number
  itemCount: number
}

export default function CartPage() {
  const params = useParams()
  const router = useRouter()
  const tenantSlug = params.tenantSlug as string

  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  // Load cart data
  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await fetch(`/api/storefront/${tenantSlug}/cart`)
        const data = await response.json()
        
        if (data.ok) {
          setCart(data.data)
        } else {
          toast.error('Failed to load cart')
        }
      } catch (error) {
        console.error('Error loading cart:', error)
        toast.error('Failed to load cart')
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [tenantSlug])

  // Update item quantity
  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 0 || newQty > 99) return

    setUpdating(productId)

    try {
      const response = await fetch(`/api/storefront/${tenantSlug}/cart/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, qty: newQty }),
      })

      const data = await response.json()

      if (data.ok) {
        setCart(data.data)
        toast.success('Cart updated')
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        toast.error(data.error || 'Failed to update cart')
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      toast.error('Failed to update cart')
    } finally {
      setUpdating(null)
    }
  }

  // Remove item from cart
  const removeItem = async (productId: string) => {
    setUpdating(productId)

    try {
      const response = await fetch(`/api/storefront/${tenantSlug}/cart/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      const data = await response.json()

      if (data.ok) {
        setCart(data.data)
        toast.success('Item removed from cart')
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        toast.error(data.error || 'Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  // Handle checkout
  const handleCheckout = () => {
    router.push(`/${tenantSlug}/checkout`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-4">Add some items to your cart to get started.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">{cart.itemCount} item(s) in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between py-4 border-b last:border-b-0">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{item.nameSnapshot}</h3>
                        <p className="text-gray-600">
                          {(item.priceSnapshot || 0)} KWD each
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, item.qty - 1)}
                            disabled={updating === item.productId || item.qty <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1
                              updateQuantity(item.productId, newQty)
                            }}
                            className="w-16 text-center"
                            min="1"
                            max="99"
                            disabled={updating === item.productId}
                          />
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, item.qty + 1)}
                            disabled={updating === item.productId || item.qty >= 99}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right min-w-[100px]">
                          <p className="font-medium">
                            {((item.priceSnapshot || 0) * item.qty).toFixed(2)} KWD
                          </p>
                        </div>

                        {/* Remove Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.productId)}
                          disabled={updating === item.productId}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                    <span>{cart.subtotal.toFixed(2)} KWD</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>0.00 KWD</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>0.00 KWD</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{cart.subtotal.toFixed(2)} KWD</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCheckout}
                    className="w-full mt-6"
                    size="lg"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}