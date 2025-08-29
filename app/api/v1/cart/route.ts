import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaRW, prismaRO } from '@/lib/db'

const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(100)
})

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100)
})

// GET /api/v1/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }

    // Get tenant
    const { resolveTenantBySlug } = await import('@/lib/tenant')
    const tenant = await resolveTenantBySlug(tenantSlug)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get user
    const { auth } = await import('@clerk/nextjs/server')
    const clerkAuth = await auth()
    
    if (!clerkAuth.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const user = await prismaRO.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Get or create cart
    let cart = await prismaRO.cart.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id
        }
      },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                productImages: {
                  take: 1,
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!cart) {
      // Create empty cart
      cart = await prismaRW.cart.create({
        data: {
          tenantId: tenant.id,
          userId: user.id
        },
        include: {
          cartItems: {
            include: {
              product: {
                include: {
                  productImages: {
                    take: 1,
                    orderBy: { order: 'asc' }
                  }
                }
              }
            }
          }
        }
      })
    }

    // Calculate totals
    const subtotal = cart.cartItems.reduce((sum, item) => {
      return sum + (item.product.price.toNumber() * item.quantity)
    }, 0)

    return NextResponse.json({
      data: {
        id: cart.id,
        items: cart.cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            title: item.product.title,
            price: item.product.price,
            currency: item.product.currency,
            image: item.product.productImages[0]?.file?.key || null
          }
        })),
        subtotal,
        itemCount: cart.cartItems.length
      }
    })

  } catch (error: any) {
    console.error('Error getting cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json(
        { error: 'Tenant slug required' },
        { status: 400 }
      )
    }

    // Get tenant
    const { resolveTenantBySlug } = await import('@/lib/tenant')
    const tenant = await resolveTenantBySlug(tenantSlug)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get user
    const { auth } = await import('@clerk/nextjs/server')
    const clerkAuth = await auth()
    
    if (!clerkAuth.userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const user = await prismaRW.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = addToCartSchema.parse(body)

    // Verify product exists and is active
    const product = await prismaRO.product.findFirst({
      where: {
        id: validatedData.productId,
        tenantId: tenant.id,
        status: 'active'
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      )
    }

    // Check stock
    if (product.stock < validatedData.quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await prismaRO.cart.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id
        }
      }
    })

    if (!cart) {
      cart = await prismaRW.cart.create({
        data: {
          tenantId: tenant.id,
          userId: user.id
        }
      })
    }

    // Add or update cart item
    const cartItem = await prismaRW.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: validatedData.productId
        }
      },
      update: {
        quantity: validatedData.quantity
      },
      create: {
        cartId: cart.id,
        productId: validatedData.productId,
        quantity: validatedData.quantity
      },
      include: {
        product: {
          include: {
            productImages: {
              take: 1,
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    return NextResponse.json({
      data: {
        id: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        product: {
          id: cartItem.product.id,
          title: cartItem.product.title,
          price: cartItem.product.price,
          currency: cartItem.product.currency,
          image: cartItem.product.productImages[0]?.file?.key || null
        }
      },
      message: 'Item added to cart'
    }, { status: 201 })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }

    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
