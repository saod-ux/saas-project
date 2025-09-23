import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantBySlug } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug') || ''
    
    console.log('Testing tenant resolution by slug:')
    console.log('Tenant slug:', tenantSlug)
    
    // Test tenant resolution by slug
    const tenant = await resolveTenantBySlug(tenantSlug)
    
    console.log('Tenant resolved:', tenant)
    
    if (tenant) {
      return NextResponse.json({
        success: true,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'No tenant found',
        debug: {
          tenantSlug,
          message: `Could not find tenant with slug: ${tenantSlug}`
        }
      })
    }
  } catch (error: any) {
    console.error('Error in test-tenant:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
