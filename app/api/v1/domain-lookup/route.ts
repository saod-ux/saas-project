import { NextResponse } from "next/server";
import { getTenantDocuments } from "@/lib/firebase/tenant";

export const runtime = "nodejs";          // Firebase requires Node runtime
export const dynamic = "force-dynamic";   // no caching; fresh lookup

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const host = (searchParams.get("host") || "").toLowerCase().split(":")[0].trim();
  if (!host) return NextResponse.json({ found: false });

  try {
    // When DB is empty, this should safely return found:false
    const allDomains = await getTenantDocuments('domains', '');
    const domainRecord = allDomains.find((d: any) => d.domain === host);
    
    if (!domainRecord) {
      return NextResponse.json({ found: false });
    }

    // Get tenant info
    const allTenants = await getTenantDocuments('tenants', '');
    const tenant = allTenants.find((t: any) => t.id === domainRecord.tenantId);
    
    const tenantSlug = tenant?.slug;
    if (!tenantSlug) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, tenantSlug });
  } catch (error) {
    console.error('Domain lookup error:', error);
    return NextResponse.json({ found: false });
  }
}