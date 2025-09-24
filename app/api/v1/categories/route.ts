import { NextRequest, NextResponse } from 'next/server'
import { getTenantDocuments, createDocument, getTenantBySlug } from '@/lib/firebase/tenant'
import { revalidatePath } from 'next/cache'
import { slugifyUnique } from '@/lib/slug'

function genId() {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
	return 'cat_' + Math.random().toString(36).slice(2, 12)
}

async function requireTenantAdmin(request: NextRequest, tenantId: string) {
	try {
		if (process.env.DEV_AUTH_BYPASS === 'true') return true
		const { getCurrentUser } = await import('@/lib/auth')
		const user = await getCurrentUser()
		if (!user) return false
		const memberships = await getTenantDocuments('memberships', tenantId)
		const membership = memberships.find((m: any) => m.userId === user.id)
		return membership?.role === 'ADMIN' || membership?.role === 'OWNER'
	} catch (e) {
		console.warn('requireTenantAdmin error', e)
		return false
	}
}

export async function GET(request: NextRequest) {
	try {
		const tenantSlug = request.headers.get('x-tenant-slug')
		if (!tenantSlug) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Tenant slug required' } }, { status: 400 })
		const tenant = await getTenantBySlug(tenantSlug)
		if (!tenant) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } }, { status: 404 })
		console.log('GET /categories', { tenantSlug, tenantId: tenant.id })
		const allCategories = await getTenantDocuments('categories', tenant.id)
		const list = allCategories.sort((a: any, b: any) => a.sortOrder - b.sortOrder)
		return NextResponse.json({ data: list, meta: { tenantId: tenant.id } })
	} catch (error) {
		console.error('GET /categories error:', error)
		return NextResponse.json({ error: { code: 'INTERNAL', message: 'Internal server error' } }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const tenantSlug = request.headers.get('x-tenant-slug')
		if (!tenantSlug) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Tenant slug required' } }, { status: 400 })
		const tenant = await getTenantBySlug(tenantSlug)
		if (!tenant) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Tenant not found' } }, { status: 404 })

		const body = await request.json()
		console.log('POST /categories', { tenantSlug, tenantId: tenant.id, body })

		const authorized = await requireTenantAdmin(request, tenant.id)
		if (!authorized) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })

		const name: string = (body?.name || '').toString().trim()
		const sortOrder: number = Number.isFinite(body?.sortOrder) ? body.sortOrder : 0
		if (!name) return NextResponse.json({ error: { code: 'VALIDATION', message: 'Name is required' } }, { status: 400 })

		const slug = await slugifyUnique(name, tenant.id)
		const created = await createDocument('categories', { 
			id: genId(), 
			tenantId: tenant.id, 
			name, 
			slug, 
			sortOrder, 
			updatedAt: new Date() 
		})

		revalidatePath(`/${tenant.slug}`)
		return NextResponse.json({ data: created }, { status: 201 })
	} catch (error: any) {
		console.error('POST /categories error:', error)
		if (process.env.NODE_ENV !== 'production') {
			return NextResponse.json({ error: { code: 'INTERNAL_DEBUG', message: String(error?.message || 'Failed to create category'), details: error } }, { status: 500 })
		}
		return NextResponse.json({ error: { code: 'INTERNAL', message: 'Failed to create category' } }, { status: 500 })
	}
}
