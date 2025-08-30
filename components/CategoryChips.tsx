'use client'

import { useTenantTheme } from '@/providers/TenantThemeProvider'

interface CategoryChipsProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  loading?: boolean
}

export default function CategoryChips({
  categories,
  selectedCategory,
  onCategoryChange,
  loading = false
}: CategoryChipsProps) {
  const { theme } = useTenantTheme()

  if (loading) {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 py-4 overflow-x-auto">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <div className="bg-white border-b" style={{ borderColor: theme.primary + '20' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-3 py-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCategory === category
                  ? 'text-white shadow-sm'
                  : 'hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: selectedCategory === category ? theme.primary : 'transparent',
                color: selectedCategory === category ? '#FFFFFF' : theme.text,
                border: selectedCategory === category ? 'none' : `1px solid ${theme.primary}20`,
              }}
            >
              {category === 'all' ? 'All Products' : category}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
