import { cookies } from 'next/headers'
import { z } from 'zod'

// Cart item shape
export interface CartItem {
  productId: string
  nameSnapshot?: string
  priceSnapshot?: number
  qty: number
}

// Cart shape
export interface Cart {
  items: CartItem[]
  tenantSlug: string
  currency: string
}

// Zod schemas
export const CartAddSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(99).default(1)
})

export const CartUpdateSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().min(0).max(99) // 0 removes item
})

export const CartRemoveSchema = z.object({
  productId: z.string().min(1)
})

export const CheckoutSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20)
})

// Cart cookie name
const CART_COOKIE_NAME = 'ev_cart'

// Helper to clamp quantity
export function clampQuantity(qty: number): number {
  return Math.max(1, Math.min(99, Math.floor(qty)))
}

// Read cart from cookie
export async function getCart(tenantSlug: string): Promise<Cart> {
  const cookieStore = await cookies()
  const cartCookie = cookieStore.get(CART_COOKIE_NAME)
  
  if (!cartCookie?.value) {
    return {
      items: [],
      tenantSlug,
      currency: 'KWD'
    }
  }

  try {
    const cart = JSON.parse(cartCookie.value) as Cart
    // Ensure cart belongs to current tenant
    if (cart.tenantSlug !== tenantSlug) {
      return {
        items: [],
        tenantSlug,
        currency: 'KWD'
      }
    }
    return cart
  } catch {
    return {
      items: [],
      tenantSlug,
      currency: 'KWD'
    }
  }
}

// Save cart to cookie
export async function saveCart(cart: Cart): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CART_COOKIE_NAME, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}

// Clear cart
export async function clearCart(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CART_COOKIE_NAME)
}

// Add item to cart
export async function addToCart(
  tenantSlug: string,
  productId: string,
  nameSnapshot: string,
  priceSnapshot: number,
  qty: number = 1
): Promise<Cart> {
  const cart = await getCart(tenantSlug)
  const clampedQty = clampQuantity(qty)
  
  // Check if item already exists
  const existingIndex = cart.items.findIndex(item => item.productId === productId)
  
  if (existingIndex >= 0) {
    // Update existing item
    cart.items[existingIndex].qty = clampQuantity(cart.items[existingIndex].qty + clampedQty)
  } else {
    // Add new item
    cart.items.push({
      productId,
      nameSnapshot,
      priceSnapshot,
      qty: clampedQty
    })
  }
  
  await saveCart(cart)
  return cart
}

// Update item quantity
export async function updateCartItem(
  tenantSlug: string,
  productId: string,
  qty: number
): Promise<Cart> {
  const cart = await getCart(tenantSlug)
  const clampedQty = clampQuantity(qty)
  
  const existingIndex = cart.items.findIndex(item => item.productId === productId)
  
  if (existingIndex >= 0) {
    if (clampedQty === 0) {
      // Remove item
      cart.items.splice(existingIndex, 1)
    } else {
      // Update quantity
      cart.items[existingIndex].qty = clampedQty
    }
  }
  
  await saveCart(cart)
  return cart
}

// Remove item from cart
export async function removeFromCart(
  tenantSlug: string,
  productId: string
): Promise<Cart> {
  const cart = await getCart(tenantSlug)
  cart.items = cart.items.filter(item => item.productId !== productId)
  await saveCart(cart)
  return cart
}

// Calculate cart subtotal
export function calculateSubtotal(cart: Cart): number {
  return cart.items.reduce((total, item) => {
    return total + (item.priceSnapshot || 0) * item.qty
  }, 0)
}

// Get cart item count
export function getCartItemCount(cart: Cart): number {
  return cart.items.reduce((total, item) => total + item.qty, 0)
}

