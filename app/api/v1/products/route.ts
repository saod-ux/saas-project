import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Product API not fully implemented
// TODO: Implement proper product management API

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product API not implemented' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Product API not implemented' },
    { status: 501 }
  )
}