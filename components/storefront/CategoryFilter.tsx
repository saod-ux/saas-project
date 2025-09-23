'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  name: string
  slug: string
  sortOrder: number
}

interface CategoryFilterProps {
  categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
      <div className="space-y-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setSelectedCategory(null)}
        >
          All Products
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  )
}










