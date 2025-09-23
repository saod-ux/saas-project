'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

interface DebugBannerProps {
  getStatusProducts?: string
  getStatusCategories?: string
  itemsCount?: number
}

export function DebugBanner({ 
  getStatusProducts, 
  getStatusCategories, 
  itemsCount 
}: DebugBannerProps) {
  const pathname = usePathname()

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span><strong>pathname:</strong> {pathname}</span>
          <span><strong>tenantId:</strong> cmf0j232o0000e4s9071kza0e</span>
          {getStatusProducts && <span><strong>GET_products:</strong> {getStatusProducts}</span>}
          {getStatusCategories && <span><strong>GET_categories:</strong> {getStatusCategories}</span>}
          {itemsCount !== undefined && <span><strong>itemsCount:</strong> {itemsCount}</span>}
        </div>
        <div className="text-amber-600">
          🚧 Development Mode
        </div>
      </div>
    </div>
  )
}
