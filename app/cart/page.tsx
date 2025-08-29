'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CartItem {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    title: string
    price: number
    currency: string
    image: string | null
  }
}

interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  itemCount: number
}

// Extract tenant slug from hostname
function extractTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname.toLowerCase()
  const parts = hostname.split('.')
  
  // Handle dev subdomains like acme.localhost or moka.localhost
  const isLocalhost = parts.includes('localhost')
  if (isLocalhost && parts.length >= 2) {
    return parts[0] || null
  }
  
  return null
}

export default function CartPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Get tenant slug on mount
  useEffect(() => {
    const slug = extractTenantSlug()
    setTenantSlug(slug)
  }, [])

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      window.location.href = '/sign-in'
    }
  }, [isLoaded, isSignedIn])

  async function loadCart() {
    if (!isSignedIn || !tenantSlug) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/cart', {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load cart')
      }
      setCart(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn && tenantSlug) {
      loadCart()
    }
  }, [isSignedIn, tenantSlug])

  async function updateQuantity(itemId: string, quantity: number) {
    if (!isSignedIn || !tenantSlug) return
    
    setUpdating(itemId)
    try {
      const res = await fetch(`/api/v1/cart/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ quantity })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.error || 'Failed to update quantity')
      }
      
      await loadCart() // Reload cart
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUpdating(null)
    }
  }

  async function removeItem(itemId: string) {
    if (!isSignedIn || !tenantSlug) return
    
    setUpdating(itemId)
    try {
      const res = await fetch(`/api/v1/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.error || 'Failed to remove item')
      }
      
      await loadCart() // Reload cart
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUpdating(null)
    }
  }

  async function checkout() {
    if (!isSignedIn || !tenantSlug || !cart) return
    
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({
          customer: {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '+1234567890'
          },
          shipping: {
            address: '123 Test St',
            city: 'Test City',
            country: 'Test Country',
            postalCode: '12345'
          },
          paymentProvider: 'STRIPE',
          notes: 'Test order'
        })
      })
      
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Checkout failed')
      }
      
      // Redirect to payment URL or show success
      if (json.data.payment.url) {
        window.location.href = json.data.payment.url
      } else {
        alert(`Order created! Order #: ${json.data.order.orderNumber}`)
        await loadCart() // Reload empty cart
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (!isLoaded) {
    return <div className="p-6">Loading...</div>
  }

  if (!isSignedIn) {
    return <div className="p-6">Redirecting to sign in...</div>
  }

  if (!tenantSlug) {
    return <div className="p-6">No tenant found. Please access via subdomain like acme.localhost:3002</div>
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Shopping Cart - {tenantSlug}</h1>

        {loading ? (
          <p>Loading cart...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Button onClick={() => window.location.href = '/admin/products'}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    {item.product.image ? (
                      <span className="text-xs">📷</span>
                    ) : (
                      <span className="text-xs">No img</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product.title}</h3>
                    <p className="text-gray-600">${item.product.price}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      disabled={updating === item.id}
                    >
                      -
                    </Button>
                    
                    <span className="w-12 text-center">{item.quantity}</span>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                    >
                      +
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      disabled={updating === item.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-medium">Subtotal ({cart.itemCount} items):</span>
                <span className="text-xl font-bold">${cart.subtotal.toFixed(2)}</span>
              </div>
              
              <Button
                onClick={checkout}
                disabled={checkoutLoading}
                className="w-full"
                size="lg"
              >
                {checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
