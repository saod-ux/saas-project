'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  currency?: string
  quantity: number
  image?: string
}

export interface CartState {
  items: CartItem[]
  couponCode?: string
  discountAmount: number
  subtotal: number
  total: number
  
  // Actions
  addItem: (product: {
    id: string
    name: string
    price: number
    currency?: string
    image?: string
  }, quantity?: number) => void
  
  removeItem: (productId: string) => void
  
  updateQuantity: (productId: string, quantity: number) => void
  
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>
  
  clearCart: () => void
  
  getItemCount: () => number
  
  getItemTotal: (productId: string) => number
  
  calculateTotals: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: undefined,
      discountAmount: 0,
      subtotal: 0,
      total: 0,

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.productId === product.id)
          
          if (existingItem) {
            // Update existing item
            const updatedItems = state.items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
            return { items: updatedItems }
          } else {
            // Add new item
            const newItem: CartItem = {
              id: `${product.id}-${Date.now()}`,
              productId: product.id,
              name: product.name,
              price: product.price,
              currency: product.currency,
              quantity,
              image: product.image,
            }
            return { items: [...state.items, newItem] }
          }
        })
        
        // Recalculate totals
        get().calculateTotals()
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.productId !== productId)
        }))
        
        // Recalculate totals
        get().calculateTotals()
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        
        set((state) => ({
          items: state.items.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          )
        }))
        
        // Recalculate totals
        get().calculateTotals()
      },

      applyCoupon: async (code) => {
        // TODO: Implement actual coupon validation
        // For now, just simulate with a simple discount
        if (code.toLowerCase() === 'welcome10') {
          set((state) => {
            const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            const discountAmount = subtotal * 0.1 // 10% discount
            return {
              couponCode: code,
              discountAmount,
              total: subtotal - discountAmount
            }
          })
          return { success: true, message: 'Coupon applied successfully!' }
        } else {
          return { success: false, message: 'Invalid coupon code' }
        }
      },

      clearCart: () => {
        set({
          items: [],
          couponCode: undefined,
          discountAmount: 0,
          subtotal: 0,
          total: 0
        })
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getItemTotal: (productId) => {
        const item = get().items.find(item => item.productId === productId)
        return item ? item.price * item.quantity : 0
      },

      calculateTotals: () => {
        const state = get()
        const subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const total = subtotal - state.discountAmount
        
        set({ subtotal, total })
      },
    }),
    {
      name: 'cart-store', // This will be overridden per tenant
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount,
      }),
    }
  )
)

// Helper to create tenant-specific cart store
export function createTenantCartStore(tenantSlug: string) {
  return useCartStore.persist.setOptions({
    name: `${tenantSlug}:cart`,
  })
}
