import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaRW } from '@/lib/db'
import { requireTenantAndRole } from '@/lib/rbac'
import { enforceLimit } from '@/lib/limits'
import * as dns from 'dns/promises'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const createDomainSchema = z.object({
  domain: z.string().min(1).max(255).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/),
})

const verifyDomainSchema = z.object({
  domain: z.string().min(1).max(255),
  verificationMethod: z.enum(['dns', 'file']).default('dns')
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    const domains = await prismaRW.domain.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        domain: true,
        dnsStatus: true,
        sslStatus: true,
        verified: true,
        verifiedAt: true,
        lastCheckedAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      ok: true,
      data: domains
    })

  } catch (error) {
    console.error('Error fetching domains:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    // Check domain limits
    const limitCheck = await enforceLimit(tenant.id, 'domains', 1);
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: limitCheck.error },
        { status: 403 }
      );
    }
    
    const body = await request.json()
    const validatedData = createDomainSchema.parse(body)
    
    // Normalize domain
    const domain = validatedData.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    
    // Check if domain already exists
    const existingDomain = await prismaRW.domain.findUnique({
      where: { domain }
    })

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domain already exists' },
        { status: 400 }
      )
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
        createdAt: true
      }
    })

    return NextResponse.json({
      ok: true,
      data: newDomain,
      message: 'Domain added successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating domain:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid domain format', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN'])
    if (result instanceof NextResponse) return result
    
    const { tenant } = result
    
    const body = await request.json()
    const validatedData = verifyDomainSchema.parse(body)
    
    const domain = validatedData.domain.toLowerCase()
    
    // Find domain record
    const domainRecord = await prismaRW.domain.findFirst({
      where: {
        domain,
        tenantId: tenant.id
      }
    })

    if (!domainRecord) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    // Perform DNS verification
    let dnsVerified = false
    let dnsError = null

    try {
      if (validatedData.verificationMethod === 'dns') {
        // Check for CNAME record pointing to our platform
        const records = await dns.resolveCname(domain)
        dnsVerified = records.some(record => 
          record.includes('your-platform-domain.com') || 
          record.includes('platform.vercel.app')
        )
      }
    } catch (error) {
      dnsError = error instanceof Error ? error.message : 'DNS lookup failed'
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
        lastCheckedAt: true
      }
    })

    return NextResponse.json({
      ok: true,
      data: updatedDomain,
      message: dnsVerified ? 'Domain verified successfully' : 'Domain verification failed',
      error: dnsError
    })

  } catch (error) {
    console.error('Error verifying domain:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
