import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Payment testing not implemented
// TODO: Implement payment provider testing

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Payment testing not implemented' },
    { status: 501 }
  )
}