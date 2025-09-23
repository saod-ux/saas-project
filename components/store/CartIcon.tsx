'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

interface CartData {
  itemCount: number
}

export default function CartIcon() {
  const params = useParams()
  const tenantSlug = params.tenantSlug as string
  const [cartData, setCartData] = useState<CartData | null>(null)

  useEffect(() => {
    // Load cart data
    const loadCart = async () => {
      try {
        const response = await fetch(`/api/storefront/${tenantSlug}/cart`)
        const data = await response.json()
        
        if (data.ok) {
          setCartData(data.data)
        }
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }

    loadCart()

    // Listen for cart updates (custom event)
    const handleCartUpdate = () => {
      loadCart()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [tenantSlug])

  return (
    <Link 
      href={`/${tenantSlug}/cart`} 
      className="relative rounded-full p-3 hover:bg-gray-100 transition-colors duration-200 group"
      aria-label="Shopping Cart"
    >
      <ShoppingCart className="h-5 w-5 text-gray-600 group-hover:text-gray-900 group-hover:scale-110 transition-all" />
      {cartData && cartData.itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse">
          {cartData.itemCount > 99 ? '99+' : cartData.itemCount}
        </span>
      )}
    </Link>
  )
}

