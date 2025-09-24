'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  variant: 'discount' | 'new' | 'popular' | 'spicy'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant, children, className }: BadgeProps) {
  const variantStyles = {
    discount: 'bg-red-500 text-white',
    new: 'bg-green-500 text-white',
    popular: 'bg-blue-500 text-white',
    spicy: 'bg-orange-500 text-white'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}













