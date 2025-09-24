'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowRight } from 'lucide-react'

interface PromoBannerProps {
  message: string
  ctaLabel?: string
  ctaHref?: string
  onCtaClick?: () => void
  dismissible?: boolean
  variant?: 'default' | 'success' | 'warning' | 'info'
}

export function PromoBanner({ 
  message, 
  ctaLabel, 
  ctaHref, 
  onCtaClick,
  dismissible = true,
  variant = 'default'
}: PromoBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const variantStyles = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <div className={`border-b ${variantStyles[variant]}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <p className="text-sm font-medium">{message}</p>
            {ctaLabel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCtaClick}
                className="text-xs h-6 px-2"
              >
                {ctaLabel}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
          
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}













