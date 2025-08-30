'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/formatPrice'
import { useCurrency } from '@/context/CurrencyContext'
import { ShoppingCart, Eye } from 'lucide-react'

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

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
  onViewDetails?: (productId: string) => void
  loading?: boolean
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onViewDetails,
  loading = false 
}: ProductCardProps) {
  const { selectedCurrency, locale } = useCurrency()
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id)
    }
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.id)
    } else {
      window.location.href = `/product/${product.id}`
    }
  }

  const isOutOfStock = product.stock <= 0 || product.status !== 'active'

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.image && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <img
              src={`/api/v1/images/${encodeURIComponent(product.image)}`}
              alt={product.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">📦</div>
              <p className="text-xs text-gray-500">No Image</p>
            </div>
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleViewDetails}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!isOutOfStock && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.hasVariants && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              Options
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-tight">
          {product.title}
        </h3>

        {product.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(product.price, selectedCurrency, locale)}
            </span>
            {selectedCurrency !== 'KWD' && (
              <span className="text-xs text-gray-500">
                {formatPrice(product.price, 'KWD', locale)}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewDetails}
              className="text-xs"
            >
              View
            </Button>
            {!isOutOfStock && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={loading}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Adding...' : 'Add to Cart'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
