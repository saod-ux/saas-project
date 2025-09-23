import { NextRequest, NextResponse } from "next/server";
import { prismaRW } from "@/lib/db";
import { z } from "zod";

const createDomainSchema = z.object({
  domain: z.string().min(1).max(255).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/),
  tenantSlug: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    // Get all domains with their tenant information
    const domains = await prismaRW.domain.findMany({
      select: {
        id: true,
        domain: true,
        dnsStatus: true,
        sslStatus: true,
        verified: true,
        verifiedAt: true,
        lastCheckedAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

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
    const tenant = await prismaRW.tenant.findUnique({
      where: { slug: validatedData.tenantSlug },
      select: { id: true, name: true, slug: true }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Normalize domain
    const domain = validatedData.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    // Check if domain already exists
    const existingDomain = await prismaRW.domain.findUnique({
      where: { domain }
    });

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      );
    }

    // Create domain record
    const newDomain = await prismaRW.domain.create({
      data: {
        tenantId: tenant.id,
        domain,
        dnsStatus: 'PENDING',
        sslStatus: 'NONE',
        verified: false
      },
      select: {
        id: true,
        domain: true,
        dnsStatus: true,
        sslStatus: true,
        verified: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      ok: true,
      data: newDomain,
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




