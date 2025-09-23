import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Product variants not implemented in schema
// TODO: Implement ProductVariant and ProductOptionValue models in Prisma schema

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product variants not implemented' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product variants not implemented' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product variants not implemented' },
    { status: 501 }
  )
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product variants not implemented' },
    { status: 501 }
  )
}