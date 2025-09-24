import { NextRequest, NextResponse } from "next/server";
import { getTenantDocuments, createDocument } from "@/lib/db";
import { requireTenantAndRole } from "@/lib/rbac";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ["OWNER", "ADMIN", "STAFF"])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result;
    
    const pages = await getTenantDocuments('pages', tenant.id)

    return NextResponse.json({ ok: true, data: pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch pages" },
      { status: 500 }
    );
  }
}
