import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";          // Prisma requires Node runtime
export const dynamic = "force-dynamic";   // no caching; fresh lookup

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = (searchParams.get("host") || "").toLowerCase().split(":")[0].trim();
  if (!host) return NextResponse.json({ found: false });

  // When DB is empty, this should safely return found:false
  const rec = await prisma.domain.findUnique({
    where: { domain: host },
    select: { tenant: { select: { slug: true } } },
  }).catch(() => null);

  const tenantSlug = rec?.tenant?.slug;
  if (!tenantSlug) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, tenantSlug });
}