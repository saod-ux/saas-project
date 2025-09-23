import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // For now, return default settings
  // In the future, this could be extended to support global platform settings
  return NextResponse.json({
    edgeCacheTTL: 60, // Default cache TTL in seconds
  });
}


