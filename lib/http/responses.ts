import { NextResponse } from 'next/server'

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[]

const baseHeaders = { 'Cache-Control': 'no-store' }

export function ok<T extends JsonValue>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, headers: baseHeaders, ...init })
}

export function badRequest(error: JsonValue, code = 'BAD_REQUEST', init?: ResponseInit) {
  return NextResponse.json({ ok: false, error, code }, { status: 400, headers: baseHeaders, ...init })
}

export function notFound(error: JsonValue = 'Not Found', code = 'NOT_FOUND', init?: ResponseInit) {
  return NextResponse.json({ ok: false, error, code }, { status: 404, headers: baseHeaders, ...init })
}

export function errorResponse(error: JsonValue, code = 'INTERNAL_ERROR', status = 500, init?: ResponseInit) {
  return NextResponse.json({ ok: false, error, code }, { status, headers: baseHeaders, ...init })
}



