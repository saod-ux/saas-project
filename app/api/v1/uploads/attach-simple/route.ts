import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: File upload not implemented
// TODO: Implement file upload functionality

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'File upload not implemented' },
    { status: 501 }
  )
}