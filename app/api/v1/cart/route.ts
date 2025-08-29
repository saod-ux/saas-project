import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaRW, prismaRO } from '@/lib/db'

const addToCartSchema = z.object({
  productId: z.string().min(1),
  productVariantId: z.string().min(1).optional(), // Optional: for variant-specific items
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
              },
              productVariant: {
                include: {
                  variantImages: {
                    take: 1,
                    orderBy: { order: 'asc' }
                  },
                  variantOptions: {
                    include: {
                      productOptionValue: {
                        include: {
                          productOption: true
                        }
                      }
                    }
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
      const price = item.productVariant?.price || item.product.price
      return sum + (price.toNumber() * item.quantity)
    }, 0)

    return NextResponse.json({
      data: {
        id: cart.id,
        items: cart.cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          product: {
            id: item.product.id,
            title: item.product.title,
            price: item.productVariant?.price || item.product.price,
            currency: item.product.currency,
            image: item.productVariant?.variantImages[0]?.file?.key || 
                   item.product.productImages[0]?.file?.key || null,
            variant: item.productVariant ? {
              id: item.productVariant.id,
              sku: item.productVariant.sku,
              options: item.productVariant.variantOptions.map(vo => ({
                name: vo.productOptionValue.productOption.name,
                value: vo.productOptionValue.value
              }))
            } : null
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

    // If variant is specified, verify it exists and check its stock
    let variant = null
    if (validatedData.productVariantId) {
      variant = await prismaRO.productVariant.findFirst({
        where: {
          id: validatedData.productVariantId,
          productId: validatedData.productId
        }
      })

      if (!variant) {
        return NextResponse.json(
          { error: 'Product variant not found' },
          { status: 404 }
        )
      }

      if (variant.stock < validatedData.quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock for this variant' },
          { status: 400 }
        )
      }
    } else {
      // Check base product stock for simple products
      if (product.stock < validatedData.quantity) {
        return NextResponse.json(
          { error: 'Insufficient stock' },
          { status: 400 }
        )
      }
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
        cartId_productId_productVariantId: {
          cartId: cart.id,
          productId: validatedData.productId,
          productVariantId: validatedData.productVariantId || null
        }
      },
      update: {
        quantity: validatedData.quantity
      },
      create: {
        cartId: cart.id,
        productId: validatedData.productId,
        productVariantId: validatedData.productVariantId || null,
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
        },
        productVariant: {
          include: {
            variantImages: {
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
        productVariantId: cartItem.productVariantId,
        quantity: cartItem.quantity,
        product: {
          id: cartItem.product.id,
          title: cartItem.product.title,
          price: cartItem.productVariant?.price || cartItem.product.price,
          currency: cartItem.product.currency,
          image: cartItem.productVariant?.variantImages[0]?.file?.key || 
                 cartItem.product.productImages[0]?.file?.key || null
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
