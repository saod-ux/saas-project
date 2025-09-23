import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return new NextResponse(null, { status: 204, headers: { 'Content-Type': 'image/png' } })
}





