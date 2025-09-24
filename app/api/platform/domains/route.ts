import { NextRequest, NextResponse } from "next/server";
import { getTenantDocuments, createDocument, getTenantBySlug } from "@/lib/firebase/tenant";
import { z } from "zod";

const createDomainSchema = z.object({
  domain: z.string().min(1).max(255).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/),
  tenantSlug: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    // Get all domains with their tenant information
    const allDomains = await getTenantDocuments('domains', '');
    const allTenants = await getTenantDocuments('tenants', '');
    
    const domains = allDomains
      .map((domain: any) => {
        const tenant = allTenants.find((t: any) => t.id === domain.tenantId);
        return {
          id: domain.id,
          domain: domain.domain,
          dnsStatus: domain.dnsStatus,
          sslStatus: domain.sslStatus,
          verified: domain.verified,
          verifiedAt: domain.verifiedAt,
          lastCheckedAt: domain.lastCheckedAt,
          createdAt: domain.createdAt,
          tenant: tenant ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug
          } : null
        };
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      ok: true,
      data: domains
    });

  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createDomainSchema.parse(body);
    
    // Find the tenant
    const tenant = await getTenantBySlug(validatedData.tenantSlug);

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Normalize domain
    const domain = validatedData.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Check if domain already exists
    const allDomains = await getTenantDocuments('domains', '');
    const existingDomain = allDomains.find((d: any) => d.domain === domain);

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      );
    }

    // Create domain record
    const newDomain = await createDocument('domains', {
      tenantId: tenant.id,
      domain,
      dnsStatus: 'PENDING',
      sslStatus: 'NONE',
      verified: false,
      createdAt: new Date()
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...newDomain,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        }
      },
      message: 'Domain added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating domain:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid domain format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




