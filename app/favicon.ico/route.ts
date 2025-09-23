import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  // Empty 204 to satisfy browser favicon requests without hitting dynamic routes
  return new NextResponse(null, { status: 204, headers: { 'Content-Type': 'image/x-icon' } })
}





