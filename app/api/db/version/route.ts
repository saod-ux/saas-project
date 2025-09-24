import { NextResponse } from 'next/server'
import { serverDb } from '@/lib/firebase/server-only'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!serverDb) {
      throw new Error('Firebase not initialized')
    }
    // For Firestore, we'll return a simple version string
    const version = 'Firestore'
    return NextResponse.json({ ok: true, version })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'DB_ERROR' }, { status: 500 })
  }
}



