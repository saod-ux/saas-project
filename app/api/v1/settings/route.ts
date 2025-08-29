import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant, getTenantSettings, updateTenantSettings } from '@/lib/tenant'
import { withTenant } from '@/lib/db'
import { updateSettingsSchema } from '@/lib/validations'

// GET /api/v1/settings - Get tenant settings
export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : await resolveTenant(host)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    const settings = await withTenant(tenant.id, async () => getTenantSettings(tenant.id))
    
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/settings - Update tenant settings
export async function PATCH(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const slugHeader = request.headers.get('x-tenant-slug') || ''
    const tenant = slugHeader ? await (await import('@/lib/tenant')).resolveTenantBySlug(slugHeader) : await resolveTenant(host)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)
    
    // Get current settings and merge with new data
    const currentSettings = await getTenantSettings(tenant.id)
    const updatedSettings = { ...currentSettings, ...validatedData }
    
    await withTenant(tenant.id, async () => updateTenantSettings(tenant.id, updatedSettings))
    
    return NextResponse.json({ data: updatedSettings })
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }
    
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
