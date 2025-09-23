import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAndRole } from '@/lib/rbac'
import { getTenantUsers, createTenantUser, findTenantUserByEmail } from '@/lib/tenant-user'
import { z } from 'zod'

const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  phone: z.string().optional(),
  isGuest: z.boolean().default(false)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN'])
    if (result instanceof NextResponse) return result

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined

    const customers = await getTenantUsers(result.tenant.id, {
      page,
      limit,
      search
    })

    return NextResponse.json({
      ok: true,
      data: customers
    })

  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch customers' },
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

    const body = await request.json()
    const validatedData = createCustomerSchema.parse(body)

    // Check if customer already exists
    const existingCustomer = await findTenantUserByEmail(result.tenant.id, validatedData.email)
    if (existingCustomer) {
      return NextResponse.json(
        { ok: false, error: 'Customer with this email already exists' },
        { status: 409 }
      )
    }

    const customer = await createTenantUser({
      tenantId: result.tenant.id,
      email: validatedData.email,
      name: validatedData.name,
      phone: validatedData.phone,
      isGuest: validatedData.isGuest
    })

    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: customer
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating customer:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}


