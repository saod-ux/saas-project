'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/formatPrice'
import { useCurrency } from '@/context/CurrencyContext'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ShoppingCart, Eye } from 'lucide-react'
import ThumbCard from '@/components/ui/ThumbCard'

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
  productImages: Array<{
    id: string
    order: number
    file: {
      id: string
      key: string
      bucket: string
      path: string
      publicUrl: string
      filename: string
      mimeType: string
    }
  }>
}

interface ProductCardProps {
  product: Product
  tenantSlug: string
  onAddToCart?: (productId: string) => void
  onViewDetails?: (productId: string) => void
  loading?: boolean
  tenantLogoUrl?: string | null
}

export default function ProductCard({ 
  product, 
  tenantSlug,
  onAddToCart, 
  onViewDetails,
  loading = false,
  tenantLogoUrl
}: ProductCardProps) {
  const { selectedCurrency, locale } = useCurrency()
  const { t } = useLocale()

  // Get the first product image as primary image
  const primaryImage = product.productImages?.[0]?.file?.publicUrl || product.image

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product.id)
    }
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.id)
    } else {
      window.location.href = `/${tenantSlug}/product/${product.id}`
    }
  }

  const isOutOfStock = product.stock <= 0 || product.status !== 'active'

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Product Image */}
      <div className="relative">
        <ThumbCard
          src={primaryImage}
          alt={product.title}
          fallbackSrc={tenantLogoUrl}
          aspectRatio="square"
        />

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
              {t('storefront.products.options')}
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
              {t('storefront.products.outOfStock')}
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
              {t('storefront.products.viewProduct')}
            </Button>
            {!isOutOfStock && (
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={loading}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? t('common.loading') : t('storefront.products.addToCart')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
