'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { TenantThemeProvider } from '@/providers/TenantThemeProvider'
import { CurrencyProvider } from '@/context/CurrencyContext'
import StorefrontHeader from '@/components/StorefrontHeader'
import CategoryChips from '@/components/CategoryChips'
import HeroSection from '@/components/HeroSection'
import ProductCard from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react'

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
  social: {
    instagram?: string
    facebook?: string
    twitter?: string
    whatsapp?: string
    tiktok?: string
  }
  categories: string[]
  // Storefront theme settings
  primary: string
  accent: string
  bg: string
  card: string
  text: string
  logoUrl?: string
  showHero: boolean
  heroTitle: string
  heroSubtitle: string
  heroCtaLabel: string
  heroCtaHref: string
  heroImageUrl?: string
  direction: 'ltr' | 'rtl'
  locale: 'en-US' | 'ar-KW'
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

function StorefrontContent() {
  const { isSignedIn } = useAuth()
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cartCount, setCartCount] = useState(0)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

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
        // Use the new settings structure
        const tenantData = json.data
        setSettings({
          storeName: tenantData.storeName || tenantSlug.toUpperCase(),
          description: tenantData.description || '',
          social: tenantData.social || {},
          categories: tenantData.categories?.items || [],
          // Storefront theme settings from direct fields
          primary: tenantData.primary || '#1F2937',
          accent: tenantData.accent || '#111827',
          bg: tenantData.bg || '#FAF7F2',
          card: tenantData.card || '#FFFFFF',
          text: tenantData.text || '#1F2937',
          logoUrl: tenantData.logoUrl,
          showHero: tenantData.showHero ?? true,
          heroTitle: tenantData.heroTitle || 'Welcome to Our Store',
          heroSubtitle: tenantData.heroSubtitle || 'Discover amazing products at great prices',
          heroCtaLabel: tenantData.heroCtaLabel || 'Shop Now',
          heroCtaHref: tenantData.heroCtaHref || '#products',
          heroImageUrl: tenantData.heroImageUrl,
          direction: tenantData.direction || 'ltr',
          locale: tenantData.locale || 'en-US',
        })
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

  async function addToCart(productId: string) {
    if (!isSignedIn || !tenantSlug) {
      window.location.href = '/sign-in'
      return
    }

    setAddingToCart(productId)
    try {
      const res = await fetch('/api/v1/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({
          productId,
          quantity: 1
        })
      })
      
      if (res.ok) {
        // Refresh cart count
        loadCartCount()
      }
    } catch (e: any) {
      console.error('Failed to add to cart:', e.message)
    } finally {
      setAddingToCart(null)
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

  // Get unique categories from settings
  const categories = ['all', ...(settings?.categories || [])]

  if (!tenantSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
          <p className="text-gray-600">Please access via subdomain like acme.localhost:3000</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7F2' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading store...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: settings.bg }}
    >
      {/* Header */}
      <StorefrontHeader
        storeName={settings.storeName}
        logoUrl={settings.logoUrl}
        cartCount={cartCount}
        onSearch={setSearchTerm}
        onCartClick={() => window.location.href = '/cart'}
        onCheckoutClick={() => window.location.href = '/checkout'}
      />

      {/* Hero Section */}
      <HeroSection
        showHero={settings.showHero}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        ctaLabel={settings.heroCtaLabel}
        ctaHref={settings.heroCtaHref}
        imageUrl={settings.heroImageUrl}
      />

      {/* Categories */}
      <CategoryChips
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        loading={loading}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Description */}
        {settings.description && (
          <div className="mb-8 text-center">
            <p 
              className="max-w-2xl mx-auto text-lg"
              style={{ color: settings.text + 'CC' }}
            >
              {settings.description}
            </p>
          </div>
        )}

        {/* Products Section */}
        <div id="products">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p style={{ color: settings.text }}>Loading products...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: settings.text }}>
                    {searchTerm ? 'No products found' : 'No products available'}
                  </h3>
                  <p style={{ color: settings.text + 'CC' }}>
                    {searchTerm 
                      ? `No products match "${searchTerm}"`
                      : 'Check back later for new products'
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm('')}
                      className="mt-4"
                      style={{ backgroundColor: settings.primary, color: '#FFFFFF' }}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      loading={addingToCart === product.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16" style={{ backgroundColor: settings.primary, color: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Store Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {settings.storeName}
              </h3>
              {settings.description && (
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
                  <a href="/cart" className="text-gray-300 hover:text-white transition-colors">
                    Shopping Cart
                  </a>
                </li>
                <li>
                  <a href="/checkout" className="text-gray-300 hover:text-white transition-colors">
                    Checkout
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {settings.social?.instagram && (
                  <a
                    href={settings.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {settings.social?.facebook && (
                  <a
                    href={settings.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {settings.social?.twitter && (
                  <a
                    href={settings.social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {settings.social?.whatsapp && (
                  <a
                    href={settings.social.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 {settings.storeName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function StorefrontPage() {
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)

  useEffect(() => {
    const slug = extractTenantSlug()
    setTenantSlug(slug)
  }, [])

  return (
    <CurrencyProvider>
      <TenantThemeProvider tenantSlug={tenantSlug || undefined}>
        <StorefrontContent />
      </TenantThemeProvider>
    </CurrencyProvider>
  )
}
