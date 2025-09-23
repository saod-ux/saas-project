import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Checkout functionality not fully implemented
// TODO: Implement proper checkout with payment providers

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Checkout functionality not implemented' },
    { status: 501 }
  )
}