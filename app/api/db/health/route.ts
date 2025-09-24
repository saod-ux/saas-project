import { NextResponse } from 'next/server'
import { serverDb } from '@/lib/firebase/server-only'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Simple Firestore health check - try to read from a collection
    if (!serverDb) {
      throw new Error('Firebase not initialized')
    }
    await serverDb.collection('_health').limit(1).get()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'DB_ERROR' }, { status: 500 })
  }
}



