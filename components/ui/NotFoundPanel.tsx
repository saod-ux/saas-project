'use client'

import { Button } from '@/components/ui/button'
import { Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface NotFoundPanelProps {
  message?: string
  showRetry?: boolean
}

export function NotFoundPanel({ 
  message = "Store not found", 
  showRetry = true
}: NotFoundPanelProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏪</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{message}</h1>
          <p className="text-gray-600">
            The store you're looking for doesn't exist or may have been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Link>
          </Button>
          
          {showRetry && (
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
