import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe<{ server_version: string }[]>(`SHOW server_version;`)
    const version = Array.isArray(rows) ? (rows[0]?.server_version || String(rows[0])) : String(rows)
    return NextResponse.json({ ok: true, version })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'DB_ERROR' }, { status: 500 })
  }
}



