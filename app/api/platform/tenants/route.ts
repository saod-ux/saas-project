import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAllDocuments, COLLECTIONS } from '@/lib/firebase/db'
import { requirePlatformRole } from '@/lib/auth'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const createTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  template: z.enum(['RESTAURANT', 'RETAIL']).default('RETAIL'),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1).max(100)
})

const querySchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
  template: z.enum(['RESTAURANT', 'RETAIL']).optional(),
  search: z.string().optional(),
  // Accept string or number, coerce and clamp
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export async function GET(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // const gate = await requirePlatformRole(request as unknown as Request, "SUPER_ADMIN")
    // if (gate instanceof NextResponse) return gate

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    // Get all tenants from Firebase
    const allTenants = await getAllDocuments(COLLECTIONS.TENANTS, 'createdAt', 1000)
    
    // Apply filters
    let filteredTenants = allTenants
    
    if (query.status) {
      filteredTenants = filteredTenants.filter((tenant: any) => tenant.status === query.status)
    }
    
    if (query.template) {
      filteredTenants = filteredTenants.filter((tenant: any) => tenant.template === query.template)
    }
    
    if (query.search) {
      const searchLower = query.search.toLowerCase()
      filteredTenants = filteredTenants.filter((tenant: any) => 
        tenant.name?.toLowerCase().includes(searchLower) ||
        tenant.slug?.toLowerCase().includes(searchLower) ||
        tenant.domain?.toLowerCase().includes(searchLower)
      )
    }

    // Sort by createdAt desc
    filteredTenants.sort((a: any, b: any) => {
      const aDate = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt)
      const bDate = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt)
      return bDate.getTime() - aDate.getTime()
    })

    // Apply pagination
    const total = filteredTenants.length
    const startIndex = (query.page - 1) * query.limit
    const endIndex = startIndex + query.limit
    const tenants = filteredTenants.slice(startIndex, endIndex)

    // Transform data to match expected format
    const transformedTenants = tenants.map((tenant: any) => ({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      domain: tenant.domain || null,
      template: tenant.template || 'RETAIL',
      status: tenant.status || 'ACTIVE',
      createdAt: tenant.createdAt?.seconds ? new Date(tenant.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
      updatedAt: tenant.updatedAt?.seconds ? new Date(tenant.updatedAt.seconds * 1000).toISOString() : new Date().toISOString(),
      _count: {
        products: 0, // TODO: Implement product count
        orders: 0,   // TODO: Implement order count
        memberships: 0 // TODO: Implement membership count
      }
    }))

    return NextResponse.json({
      ok: true,
      data: transformedTenants,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    })

  } catch (error) {
    console.error('Error fetching tenants:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Temporarily disable auth for testing
    // const gate = await requirePlatformRole(request as unknown as Request, "SUPER_ADMIN")
    // if (gate instanceof NextResponse) return gate

    const body = await request.json()
    const validatedData = createTenantSchema.parse(body)
    
    // Check if tenant slug already exists
    const allTenants = await getAllDocuments(COLLECTIONS.TENANTS)
    const existingTenant = allTenants.find((tenant: any) => tenant.slug === validatedData.slug)

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant slug already exists' },
        { status: 400 }
      )
    }

    // Create tenant using Firebase
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const tenant = {
      id: tenantId,
      name: validatedData.name,
      slug: validatedData.slug,
      template: validatedData.template,
      status: 'ACTIVE',
      settingsJson: JSON.stringify({
        template: validatedData.template.toLowerCase(),
        branding: {
          storeName: validatedData.name,
          logoUrl: null
        }
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Use the createTenant function from Firebase
    const { createTenant } = await import('@/lib/firebase/tenant')
    await createTenant(tenant)

    return NextResponse.json({
      ok: true,
      data: tenant,
      message: 'Tenant created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating tenant:', error)
    
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

