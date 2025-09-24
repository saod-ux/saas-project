// This file uses API calls instead of direct database access

export interface Tenant {
  id: string
  slug: string
  name: string
  settingsJson?: any
}

export interface Category {
  id: string
  name: string
  slug: string
  sortOrder: number
  visible?: boolean
  featured?: boolean
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  active: boolean
  primaryCategoryId?: string
  primaryImage?: {
    publicUrl: string
  }
  productImages?: Array<{
    file: {
      publicUrl: string
    }
  }>
  category?: Category
}

export async function getTenant(tenantSlug: string): Promise<Tenant | null> {
  try {
    const res = await fetch(`/api/admin/${tenantSlug}/tenant`, {
      headers: { 'x-tenant-slug': tenantSlug },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`Failed to fetch tenant: ${res.status}`)
    }
    
    const json = await res.json()
    return json.data || null
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return null
  }
}

export async function getCategories(tenantSlug: string): Promise<Category[]> {
  try {
    const res = await fetch('/api/v1/categories', {
      headers: { 'x-tenant-slug': tenantSlug },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.status}`)
    }
    
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function getProducts(tenantSlug: string, options: {
  categoryId?: string
  limit?: number
  offset?: number
} = {}): Promise<Product[]> {
  try {
    const params = new URLSearchParams()
    if (options.categoryId) params.set('categoryId', options.categoryId)
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.offset) params.set('offset', options.offset.toString())
    
    const res = await fetch(`/api/v1/products?${params}`, {
      headers: { 'x-tenant-slug': tenantSlug },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`)
    }
    
    const json = await res.json()
    return json.data || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function getProductById(tenantSlug: string, productId: string): Promise<Product | null> {
  try {
    const res = await fetch(`/api/v1/products/${productId}`, {
      headers: { 'x-tenant-slug': tenantSlug },
      cache: 'no-store'
    })
    
    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`Failed to fetch product: ${res.status}`)
    }
    
    const json = await res.json()
    return json.data || null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Mock data for development
export function getMockCategories(): Category[] {
  return [
    { id: '1', name: 'Appetizers', slug: 'appetizers', sortOrder: 1, visible: true, featured: true },
    { id: '2', name: 'Main Courses', slug: 'main-courses', sortOrder: 2, visible: true, featured: true },
    { id: '3', name: 'Desserts', slug: 'desserts', sortOrder: 3, visible: true, featured: false },
    { id: '4', name: 'Beverages', slug: 'beverages', sortOrder: 4, visible: true, featured: false },
  ]
}

export function getMockProducts(): Product[] {
  return [
    {
      id: '1',
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with parmesan cheese and croutons',
      price: 8.50,
      currency: 'KWD',
      active: true,
      primaryCategoryId: '1',
      primaryImage: { publicUrl: '/placeholder-food.jpg' }
    },
    {
      id: '2',
      name: 'Grilled Chicken',
      description: 'Tender grilled chicken breast with herbs',
      price: 15.00,
      currency: 'KWD',
      active: true,
      primaryCategoryId: '2',
      primaryImage: { publicUrl: '/placeholder-food.jpg' }
    },
    {
      id: '3',
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake with vanilla ice cream',
      price: 6.00,
      currency: 'KWD',
      active: true,
      primaryCategoryId: '3',
      primaryImage: { publicUrl: '/placeholder-food.jpg' }
    },
    {
      id: '4',
      name: 'Fresh Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 3.50,
      currency: 'KWD',
      active: true,
      primaryCategoryId: '4',
      primaryImage: { publicUrl: '/placeholder-drink.jpg' }
    },
  ]
}
