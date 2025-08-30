import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// POST /api/v1/settings/revalidate - Revalidate storefront pages
export async function POST(request: NextRequest) {
  try {
    // Revalidate storefront pages
    revalidatePath('/')
    revalidatePath('/product/[id]')
    revalidatePath('/cart')
    revalidatePath('/checkout')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Storefront pages revalidated successfully' 
    })
  } catch (error) {
    console.error('Error revalidating storefront:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate storefront' },
      { status: 500 }
    )
  }
}
