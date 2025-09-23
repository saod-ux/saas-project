import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const { slug, name, logoUrl } = await req.json();
  if (!slug || !name) {
    return NextResponse.json({ ok: false, error: "slug and name are required" }, { status: 400 });
  }
  const data = await prisma.tenant.upsert({
    where: { slug },
    update: { name, logoUrl },
    create: { slug, name, logoUrl },
  });
  return NextResponse.json({ ok: true, data });
}
