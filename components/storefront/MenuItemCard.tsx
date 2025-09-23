'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Plus, Minus } from 'lucide-react'
import { Badge } from './Badge'

interface MenuItemCardProps {
  item: {
    id: string
    name: string
    description?: string
    price: number
    currency?: string
    primaryImage?: {
      publicUrl: string
    }
    productImages?: Array<{
      file: {
        publicUrl: string
      }
    }>
    badges?: Array<{
      type: 'discount' | 'new' | 'popular' | 'spicy'
      text: string
    }>
  }
  onAddToCart?: (itemId: string, quantity: number) => void
  onViewDetails?: (itemId: string) => void
  className?: string
}

export function MenuItemCard({ 
  item, 
  onAddToCart, 
  onViewDetails,
  className = '' 
}: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(1)
  
  // Get primary image
  const primaryImage = item.primaryImage || 
    (item.productImages && item.productImages[0]?.file)

  const handleAddToCart = () => {
    onAddToCart?.(item.id, quantity)
    setQuantity(1) // Reset after adding
  }

  const formatPrice = (price: number, currency = 'KWD') => {
    return new Intl.NumberFormat('en-KW', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  // Determine if item has discount (mock logic)
  const hasDiscount = Math.random() > 0.7
  const discountPercent = hasDiscount ? Math.floor(Math.random() * 30) + 10 : 0
  const originalPrice = hasDiscount ? item.price / (1 - discountPercent / 100) : item.price

  // Determine if item is new (mock logic)
  const isNew = Math.random() > 0.8
  const isPopular = Math.random() > 0.6
  const isSpicy = Math.random() > 0.7

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group ${className}`}>
      {/* Image with badges */}
      <div className="aspect-square relative bg-gray-100 overflow-hidden">
        {primaryImage?.publicUrl ? (
          <Image
            src={primaryImage.publicUrl}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-sm">No Image</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge variant="discount">-{discountPercent}%</Badge>
          )}
          {isNew && (
            <Badge variant="new">New</Badge>
          )}
          {isPopular && (
            <Badge variant="popular">Popular</Badge>
          )}
          {isSpicy && (
            <Badge variant="spicy">🌶️ Spicy</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {item.name}
        </h3>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(item.price, item.currency)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(originalPrice, item.currency)}
              </span>
            )}
          </div>
        </div>

        {/* Quantity Stepper */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={handleAddToCart}
            className="flex-1"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
          
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(item.id)}
            >
              View
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
