import { NextResponse } from "next/server";
import { getTenantBySlug, createDocument, updateDocument } from "@/lib/firebase/tenant";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const { slug, name, logoUrl } = await req.json();
  if (!slug || !name) {
    return NextResponse.json({ ok: false, error: "slug and name are required" }, { status: 400 });
  }
  
  // Check if tenant exists
  const existingTenant = await getTenantBySlug(slug);
  
  let data;
  if (existingTenant) {
    // Update existing tenant
    data = await updateDocument('tenants', existingTenant.id, { name, logoUrl });
  } else {
    // Create new tenant
    data = await createDocument('tenants', { slug, name, logoUrl });
  }
  
  return NextResponse.json({ ok: true, data });
}
