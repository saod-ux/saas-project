import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // We'll add authentication logic later when needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc)
    '/((?!_next|api|favicon.ico).*)',
  ],
};