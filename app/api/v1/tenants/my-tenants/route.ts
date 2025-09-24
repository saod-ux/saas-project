import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getTenantDocuments } from '@/lib/firebase/tenant'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all tenants where the user has a membership
    const allMemberships = await getTenantDocuments('memberships', '');
    const userMemberships = allMemberships.filter((m: any) => m.userId === user.id);

    // Get tenant details for each membership
    const allTenants = await getTenantDocuments('tenants', '');
    const tenants = userMemberships.map((membership: any) => {
      const tenant = allTenants.find((t: any) => t.id === membership.tenantId);
      return tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      } : null;
    }).filter(Boolean);

    return NextResponse.json({ 
      data: tenants,
      message: 'Tenants retrieved successfully'
    })

  } catch (error: any) {
    console.error('Error fetching user tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}







