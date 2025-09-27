export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { getTenantDocuments, updateDocument, deleteDocument } from '@/lib/firebase/tenant'
import { getTenantBySlug } from '@/lib/services/tenant'
import { revalidatePath } from 'next/cache'

async function requireTenantAdmin(request: NextRequest, tenantId: string) {
	try {
		const { getCurrentUser } = await import('@/lib/auth')
		const user = await getCurrentUser()
		if (!user) return false
		const memberships = await getTenantDocuments('memberships', tenantId)
		const membership = memberships.find((m: any) => m.userId === user.id)
		return membership?.role === 'ADMIN' || membership?.role === 'OWNER'
	} catch {
		return false
	}
}

// PATCH /api/v1/categories/:id - update
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const tenantSlug = request.headers.get('x-tenant-slug')
		if (!tenantSlug) return NextResponse.json({ error: 'Tenant slug required' }, { status: 400 })
		const tenant = await getTenantBySlug(tenantSlug)
		if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

		const authorized = await requireTenantAdmin(request, tenant.id)
		if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const body = await request.json()
		const data: any = {}
		if ('name' in body) data.name = (body.name || '').toString().trim()
		if ('sortOrder' in body && Number.isFinite(body.sortOrder)) data.sortOrder = body.sortOrder
		// Ignore slug changes to keep URLs stable

		const updated = await updateDocument('categories', params.id, data)
		revalidatePath(`/${tenant.slug}`)
		return NextResponse.json({ data: updated })
	} catch (error: any) {
		console.error('PATCH /categories/:id error:', error)
		return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
	}
}

// DELETE /api/v1/categories/:id - delete
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const tenantSlug = request.headers.get('x-tenant-slug')
		if (!tenantSlug) return NextResponse.json({ error: 'Tenant slug required' }, { status: 400 })
		const tenant = await getTenantBySlug(tenantSlug)
		if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

		const authorized = await requireTenantAdmin(request, tenant.id)
		if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		await deleteDocument('categories', params.id)
		revalidatePath(`/${tenant.slug}`)
		return NextResponse.json({ ok: true })
	} catch (error: any) {
		console.error('DELETE /categories/:id error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
