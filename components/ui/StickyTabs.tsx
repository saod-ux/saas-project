'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StickyTabsProps {
  tabs: Array<{
    id: string
    label: string
    count?: number
  }>
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function StickyTabs({ tabs, activeTab, onTabChange, className }: StickyTabsProps) {
  return (
    <div className={cn("sticky top-16 z-40 bg-white border-b border-gray-200", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}














