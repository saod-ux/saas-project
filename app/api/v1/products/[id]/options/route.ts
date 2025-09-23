import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Product options not implemented in schema
// TODO: Implement ProductOption model in Prisma schema

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product options not implemented' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product options not implemented' },
    { status: 501 }
  )
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product options not implemented' },
    { status: 501 }
  )
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product options not implemented' },
    { status: 501 }
  )
}