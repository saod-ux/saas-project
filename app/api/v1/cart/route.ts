import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Cart models not implemented in schema
// TODO: Implement Cart and CartItem models in Prisma schema

// GET /api/v1/cart - Get user's cart
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart functionality not implemented' },
    { status: 501 }
  )
}

// POST /api/v1/cart - Add item to cart
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart functionality not implemented' },
    { status: 501 }
  )
}

// DELETE /api/v1/cart - Clear cart
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Cart functionality not implemented' },
    { status: 501 }
  )
}