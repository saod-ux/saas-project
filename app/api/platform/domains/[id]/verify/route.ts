import { NextRequest, NextResponse } from "next/server";
import { prismaRW } from "@/lib/db";
import dns from "dns";
import { promisify } from "util";

const resolveCname = promisify(dns.resolveCname);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Find domain record
    const domainRecord = await prismaRW.domain.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        domain: true,
        tenantId: true,
        dnsStatus: true,
        verified: true
      }
    });

    if (!domainRecord) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Perform DNS verification
    let dnsVerified = false;
    let dnsError = null;

    try {
      // Check for CNAME record pointing to our platform
      const records = await resolveCname(domainRecord.domain);
      dnsVerified = records.some(record => 
        record.includes('your-platform-domain.com') || 
        record.includes('platform.vercel.app') ||
        record.includes('localhost:3000')
      );
    } catch (error) {
      dnsError = error instanceof Error ? error.message : 'DNS lookup failed';
    }

    // Update domain status
    const updatedDomain = await prismaRW.domain.update({
      where: { id: domainRecord.id },
      data: {
        dnsStatus: dnsVerified ? 'VERIFIED' : 'INVALID',
        verified: dnsVerified,
        verifiedAt: dnsVerified ? new Date() : null,
        lastCheckedAt: new Date()
      },
      select: {
        id: true,
        domain: true,
        dnsStatus: true,
        sslStatus: true,
        verified: true,
        verifiedAt: true,
        lastCheckedAt: true,
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
      data: updatedDomain,
      message: dnsVerified ? 'Domain verified successfully' : 'Domain verification failed'
    });

  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




