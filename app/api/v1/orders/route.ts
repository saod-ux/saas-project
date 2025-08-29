import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant'
import { getTenantPrisma } from '@/lib/db'
import { createOrderSchema } from '@/lib/validations'

// GET /api/v1/orders - basic list
export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : await resolveTenant(host)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const page = Number(searchParams.get('page') || 1)
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status

    const db = getTenantPrisma(tenant.id)
    const [orders, total] = await Promise.all([
      db.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      db.order.count({ where })
    ])

    return NextResponse.json({
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('Error listing orders:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/orders - create basic order
export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : await resolveTenant(host)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createOrderSchema.parse(body)

    const db = getTenantPrisma(tenant.id)
    const order = await db.order.create({
      data: {
        tenantId: tenant.id,
        status: 'pending',
        totalsJson: validated.totalsJson,
        customerJson: validated.customerJson,
      }
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: err.issues }, { status: 400 })
    }
    console.error('Error creating order:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
