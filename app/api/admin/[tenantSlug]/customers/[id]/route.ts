import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAndRole } from '@/lib/rbac'
import { getTenantUserById, updateTenantUser, deleteTenantUser } from '@/lib/tenant-user'
import { z } from 'zod'

const updateCustomerSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  isGuest: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN'])
    if (result instanceof NextResponse) return result

    const customer = await getTenantUserById(result.tenant.id, params.id)
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: customer
    })

  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER', 'ADMIN'])
    if (result instanceof NextResponse) return result

    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)

    const customer = await updateTenantUser(result.tenant.id, params.id, validatedData)
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer not found or update failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      data: customer
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating customer:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { tenantSlug: string; id: string } }
) {
  try {
    const result = await requireTenantAndRole(request, params.tenantSlug, ['OWNER'])
    if (result instanceof NextResponse) return result

    const success = await deleteTenantUser(result.tenant.id, params.id)
    if (!success) {
      return NextResponse.json(
        { ok: false, error: 'Customer not found or delete failed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Customer deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}


