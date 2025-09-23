import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Order functionality not fully implemented
// TODO: Implement proper order management

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Order functionality not implemented' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Order functionality not implemented' },
    { status: 501 }
  )
}