'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Search, Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react'

interface Product {
  id: string
  title: string
  description: string | null
  price: number
  currency: string
  stock: number
  status: string
  hasVariants: boolean
  image: string | null
}

interface TenantSettings {
  storeName: string
  description: string
  socialLinks: {
    instagram?: string
    facebook?: string
    twitter?: string
    whatsapp?: string
    tiktok?: string
  }
  categories: string[]
}

// Extract tenant slug from hostname
function extractTenantSlug(): string | null {
  if (typeof window === 'undefined') return null
  const hostname = window.location.hostname.toLowerCase()
  const parts = hostname.split('.')
  
  const isLocalhost = parts.includes('localhost')
  if (isLocalhost && parts.length >= 2) {
    return parts[0] || null
  }
  
  return null
}

export default function StorefrontPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cartCount, setCartCount] = useState(0)

  // Get tenant slug on mount
  useEffect(() => {
    const slug = extractTenantSlug()
    setTenantSlug(slug)
  }, [])

  async function loadProducts() {
    if (!tenantSlug) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/products', {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to load products')
      }
      setProducts(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadSettings() {
    if (!tenantSlug) return
    
    try {
      const res = await fetch('/api/v1/settings', {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (res.ok) {
        setSettings(json.data)
      }
    } catch (e: any) {
      console.error('Failed to load settings:', e.message)
    }
  }

  async function loadCartCount() {
    if (!isSignedIn || !tenantSlug) return
    
    try {
      const res = await fetch('/api/v1/cart', {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const json = await res.json()
      if (res.ok) {
        setCartCount(json.data.itemCount || 0)
      }
    } catch (e: any) {
      console.error('Failed to load cart count:', e.message)
    }
  }

  useEffect(() => {
    if (tenantSlug) {
      loadProducts()
      loadSettings()
    }
  }, [tenantSlug])

  useEffect(() => {
    if (isSignedIn && tenantSlug) {
      loadCartCount()
    }
  }, [isSignedIn, tenantSlug])

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || true // TODO: Add category filtering
    return matchesSearch && matchesCategory && product.status === 'active'
  })

  // Get unique categories from products (placeholder)
  const categories = ['all', 'electronics', 'clothing', 'home', 'books']

  if (!tenantSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
          <p className="text-gray-600">Please access via subdomain like acme.localhost:3002</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Store Name */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {settings?.storeName || tenantSlug.toUpperCase()}
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Cart & Auth */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/cart'}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
              
              {isSignedIn ? (
                <Button onClick={() => window.location.href = '/admin/products'}>
                  Admin
                </Button>
              ) : (
                <Button onClick={() => window.location.href = '/sign-in'}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 py-4 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            {/* Store Description */}
            {settings?.description && (
              <div className="mb-8 text-center">
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {settings.description}
                </p>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                      {product.image ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${product.image}`}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling!.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${product.image ? 'hidden' : 'flex'}`}>
                        <div className="text-center">
                          <span className="text-4xl text-gray-400 mb-2">📦</span>
                          <p className="text-xs text-gray-500">No Image</p>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-3 text-lg line-clamp-2">
                        {product.title}
                      </h3>
                      
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-blue-600">
                          ${product.price}
                        </span>
                        
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            window.location.href = `/product/${product.id}`;
                          }}
                        >
                          View Details
                        </Button>
                      </div>

                      {product.hasVariants && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <span>⚙️</span>
                          <span>Multiple options available</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer with Social Links */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Store Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {settings?.storeName || tenantSlug.toUpperCase()}
              </h3>
              {settings?.description && (
                <p className="text-gray-300 text-sm">
                  {settings.description}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/cart" className="text-gray-300 hover:text-white">
                    Shopping Cart
                  </a>
                </li>
                <li>
                  <a href="/admin/products" className="text-gray-300 hover:text-white">
                    Admin Panel
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {settings?.socialLinks?.instagram && (
                  <a
                    href={settings.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {settings?.socialLinks?.facebook && (
                  <a
                    href={settings.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {settings?.socialLinks?.twitter && (
                  <a
                    href={settings.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {settings?.socialLinks?.whatsapp && (
                  <a
                    href={settings.socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 {settings?.storeName || tenantSlug.toUpperCase()}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
