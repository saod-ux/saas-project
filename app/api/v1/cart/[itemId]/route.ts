import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Cart models not implemented in schema
// TODO: Implement Cart and CartItem models in Prisma schema

// PATCH /api/v1/cart/[itemId] - Update cart item
export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart functionality not implemented' },
    { status: 501 }
  )
}

// DELETE /api/v1/cart/[itemId] - Remove cart item
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart functionality not implemented' },
    { status: 501 }
  )
}