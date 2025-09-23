import { NextRequest, NextResponse } from 'next/server'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DISABLED: Invite models not implemented in schema
// TODO: Implement Invite model in Prisma schema

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Invite functionality not implemented' },
    { status: 501 }
  )
}