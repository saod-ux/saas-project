import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive().max(100)
})

// PATCH /api/v1/cart/[itemId] - Update cart item quantity
export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
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
    
    const user = await import('@/lib/db').then(db => db.prismaRW.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    }))
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = updateCartItemSchema.parse(body)

    // Get cart item and verify ownership
    const cartItem = await import('@/lib/db').then(db => db.prismaRO.cartItem.findFirst({
      where: {
        id: params.itemId,
        cart: {
          tenantId: tenant.id,
          userId: user.id
        }
      },
      include: {
        product: true
      }
    }))

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Check stock
    if (cartItem.product.stock < validatedData.quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock' },
        { status: 400 }
      )
    }

    // Update cart item
    const updatedCartItem = await import('@/lib/db').then(db => db.prismaRW.cartItem.update({
      where: { id: params.itemId },
      data: { quantity: validatedData.quantity },
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
    }))

    return NextResponse.json({
      data: {
        id: updatedCartItem.id,
        productId: updatedCartItem.productId,
        quantity: updatedCartItem.quantity,
        product: {
          id: updatedCartItem.product.id,
          title: updatedCartItem.product.title,
          price: updatedCartItem.product.price,
          currency: updatedCartItem.product.currency,
          image: updatedCartItem.product.productImages[0]?.file?.key || null
        }
      },
      message: 'Cart item updated'
    })

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 422 }
      )
    }

    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/cart/[itemId] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
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
    
    const user = await import('@/lib/db').then(db => db.prismaRW.user.findFirst({
      where: { clerkId: clerkAuth.userId }
    }))
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Verify cart item ownership
    const cartItem = await import('@/lib/db').then(db => db.prismaRO.cartItem.findFirst({
      where: {
        id: params.itemId,
        cart: {
          tenantId: tenant.id,
          userId: user.id
        }
      }
    }))

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      )
    }

    // Delete cart item
    await import('@/lib/db').then(db => db.prismaRW.cartItem.delete({
      where: { id: params.itemId }
    }))

    return NextResponse.json({
      message: 'Item removed from cart'
    })

  } catch (error: any) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
