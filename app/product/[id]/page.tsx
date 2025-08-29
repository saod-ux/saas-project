'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ShoppingCart } from 'lucide-react'

interface ProductOption {
  id: string
  name: string
  required: boolean
  values: ProductOptionValue[]
}

interface ProductOptionValue {
  id: string
  value: string
}

interface ProductVariant {
  id: string
  sku: string | null
  price: number
  stock: number
  options: { optionName: string; optionValue: string }[]
  images: { id: string; key: string; alt: string | null }[]
}

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
  options: ProductOption[]
  variants: ProductVariant[]
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

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { isSignedIn, isLoaded } = useAuth()
  const [tenantSlug, setTenantSlug] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  // Get tenant slug on mount
  useEffect(() => {
    const slug = extractTenantSlug()
    setTenantSlug(slug)
  }, [])

  async function loadProduct() {
    if (!tenantSlug) return
    
    setLoading(true)
    setError(null)
    try {
      // Load product details
      const productRes = await fetch(`/api/v1/products/${params.id}`, {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const productJson = await productRes.json()
      if (!productRes.ok) {
        throw new Error(productJson?.error || 'Failed to load product')
      }

      // Load product options
      const optionsRes = await fetch(`/api/v1/products/${params.id}/options`, {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const optionsJson = await optionsRes.json()

      // Load product variants
      const variantsRes = await fetch(`/api/v1/products/${params.id}/variants`, {
        headers: {
          'x-tenant-slug': tenantSlug
        }
      })
      const variantsJson = await variantsRes.json()

      setProduct({
        ...productJson.data,
        options: optionsRes.ok ? optionsJson.data : [],
        variants: variantsRes.ok ? variantsJson.data : []
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantSlug) {
      loadProduct()
    }
  }, [tenantSlug])

  // Initialize selected options with first value for each option
  useEffect(() => {
    if (product?.options) {
      const initialOptions: Record<string, string> = {}
      product.options.forEach(option => {
        if (option.values.length > 0) {
          initialOptions[option.id] = option.values[0].id
        }
      })
      setSelectedOptions(initialOptions)
    }
  }, [product])

  // Find the selected variant based on selected options
  const selectedVariant = product?.variants.find(variant => {
    return variant.options.every(variantOption => {
      const option = product.options.find(opt => opt.name === variantOption.optionName)
      if (!option) return false
      const selectedValueId = selectedOptions[option.id]
      const selectedValue = option.values.find(val => val.id === selectedValueId)
      return selectedValue && selectedValue.value === variantOption.optionValue
    })
  })

  // Get current price (variant price or base product price)
  const currentPrice = selectedVariant?.price || product?.price || 0
  const currentStock = selectedVariant?.stock || product?.stock || 0

  async function addToCart() {
    if (!isSignedIn || !tenantSlug || !product) return
    
    setAddingToCart(true)
    try {
      const res = await fetch('/api/v1/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({
          productId: product.id,
          productVariantId: selectedVariant?.id,
          quantity
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error?.error || 'Failed to add to cart')
      }
      
      alert('Added to cart!')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setAddingToCart(false)
    }
  }

  function handleOptionChange(optionId: string, valueId: string) {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: valueId
    }))
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading product...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600">{error || 'The product you are looking for does not exist.'}</p>
          <Button onClick={() => window.location.href = '/'} className="mt-4">
            Back to Store
          </Button>
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
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
            
            <h1 className="text-xl font-bold text-gray-900">
              {tenantSlug.toUpperCase()}
            </h1>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/cart'}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
            </Button>
          </div>
        </div>
      </header>

      {/* Product Details */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {selectedVariant?.images[0]?.key || product.image ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold text-center px-8">
                    {product.title}
                  </span>
                </div>
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${(selectedVariant?.images[0]?.key || product.image) ? 'hidden' : 'flex'}`}>
                <div className="text-center">
                  <span className="text-6xl text-gray-400 mb-4">📦</span>
                  <p className="text-sm text-gray-500">No Image Available</p>
                </div>
              </div>
            </div>
            
            {/* Variant Images */}
            {selectedVariant?.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {selectedVariant.images.map((image) => (
                  <div
                    key={image.id}
                    className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0"
                  >
                    <img 
                      src={`https://picsum.photos/80/80?random=${image.id}`}
                      alt={image.alt || product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center hidden">
                      <span className="text-lg">📷</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              
              {product.description && (
                <p className="text-gray-600 mb-4">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="text-3xl font-bold text-gray-900">
              ${currentPrice}
            </div>

            {/* Stock Status */}
            <div className="text-sm text-gray-600">
              {currentStock > 0 ? (
                <span className="text-green-600">In Stock ({currentStock} available)</span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>

            {/* Product Options */}
            {product.hasVariants && product.options.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Options</h3>
                {product.options.map((option) => (
                  <div key={option.id} className="space-y-2">
                    <Label className="text-sm font-medium">
                      {option.name} {option.required && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => (
                        <button
                          key={value.id}
                          onClick={() => handleOptionChange(option.id, value.id)}
                          className={`px-3 py-2 border rounded-md text-sm ${
                            selectedOptions[option.id] === value.id
                              ? 'border-blue-600 bg-blue-50 text-blue-600'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {value.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Variant Info */}
            {selectedVariant && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Selected Options:</h4>
                <div className="space-y-1">
                  {selectedVariant.options.map((option, index) => (
                    <p key={index} className="text-sm text-gray-600">
                      {option.optionName}: {option.optionValue}
                    </p>
                  ))}
                </div>
                {selectedVariant.sku && (
                  <p className="text-sm text-gray-500 mt-2">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={currentStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  disabled={quantity >= currentStock}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={addToCart}
              disabled={addingToCart || currentStock === 0 || quantity > currentStock}
              className="w-full"
              size="lg"
            >
              {addingToCart ? 'Adding...' : currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>

            {/* Additional Info */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Product ID:</span>
                <span className="font-mono">{product.id}</span>
              </div>
              {product.hasVariants && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Variants Available:</span>
                  <span>{product.variants.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
