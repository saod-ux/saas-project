'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, X } from 'lucide-react'

interface FloatingCartButtonProps {
  itemCount: number
  onCartClick?: () => void
  className?: string
}

export function FloatingCartButton({ 
  itemCount, 
  onCartClick,
  className = '' 
}: FloatingCartButtonProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible || itemCount === 0) {
    return null
  }

  return (
    <div className={`fixed bottom-20 right-4 z-50 ${className}`}>
      <div className="relative">
        <Button
          onClick={onCartClick}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          size="lg"
        >
          <ShoppingCart className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
              {itemCount}
            </span>
          )}
        </Button>
        
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -left-2 bg-gray-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs hover:bg-gray-600"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}














