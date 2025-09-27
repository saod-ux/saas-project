import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateTenant, getTenantDocuments, createDocument } from '@/lib/firebase/tenant'
import { getTenantBySlug } from '@/lib/services/tenant'
import { requirePlatformRole } from '@/lib/auth'
import { ok, badRequest, notFound, errorResponse } from '@/lib/http/responses'

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  reason: z.string().optional(),
  notes: z.string().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Require platform admin role
    const gate = await requirePlatformRole(request, "SUPER_ADMIN")
    if (gate instanceof NextResponse) return gate
    const { userId } = gate
    
    const { slug } = params
    const body = await request.json()
    
    // Validate request body
    const validatedData = updateStatusSchema.parse(body)
    
    // Check if tenant exists
    const existingTenant = await getTenantBySlug(slug);

    if (!existingTenant) return notFound('Tenant not found')

    // Prevent downgrading from ARCHIVED
    if (existingTenant.status === 'ARCHIVED' && validatedData.status !== 'ARCHIVED') {
      return badRequest('Cannot change status of archived tenant. Contact support to restore.')
    }

    // Update tenant status
    const updatedTenant = await updateTenant(existingTenant.id, { 
      status: validatedData.status,
      updatedAt: new Date()
    });

    // Log the status change
    await createDocument('auditLogs', {
      tenantId: existingTenant.id,
      actorUserId: userId,
      action: 'TENANT_STATUS_CHANGED',
      targetType: 'TENANT',
      targetId: existingTenant.id,
      meta: {
        oldStatus: existingTenant.status,
        newStatus: validatedData.status,
        reason: validatedData.reason,
        notes: validatedData.notes,
        changedBy: userId
      },
      createdAt: new Date()
    });

    // If suspending, notify tenant members
    if (validatedData.status === 'SUSPENDED') {
      // TODO: Send notification emails to tenant members
      const allMemberships = await getTenantDocuments('memberships', existingTenant.id);
      console.log(`Tenant ${slug} suspended. Notifying ${allMemberships.length} members.`)
    }

    return ok({
      id: updatedTenant.id,
      slug: updatedTenant.slug,
      name: updatedTenant.name,
      status: updatedTenant.status,
      updatedAt: updatedTenant.updatedAt
    })

  } catch (error) {
    console.error('Error updating tenant status:', error)
    
    if (error instanceof z.ZodError) return badRequest({ message: 'Invalid request data', details: error.errors })

    return errorResponse('Internal server error')
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Require platform admin role
    const gate = await requirePlatformRole(request, "SUPER_ADMIN")
    if (gate instanceof NextResponse) return gate
    const { userId } = gate
    
    const { slug } = params

    const tenant = await getTenantBySlug(slug);

    if (!tenant) return notFound('Tenant not found')

    // Get related data
    const allMemberships = await getTenantDocuments('memberships', tenant.id);
    const allUsers = await getTenantDocuments('users', '');
    const allProducts = await getTenantDocuments('products', tenant.id);
    const allOrders = await getTenantDocuments('orders', tenant.id);

    const memberships = allMemberships.map((membership: any) => {
      const user = allUsers.find((u: any) => u.id === membership.userId);
      return {
        user: user ? {
          email: user.email,
          name: user.name
        } : null,
        role: membership.role,
        status: membership.status
      };
    });

    const tenantWithCounts = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      memberships,
      _count: {
        products: allProducts.length,
        orders: allOrders.length,
        memberships: allMemberships.length
      }
    };

    return ok(tenantWithCounts)

  } catch (error) {
    console.error('Error fetching tenant status:', error)
    return errorResponse('Internal server error')
  }
}

