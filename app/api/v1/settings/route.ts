import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant, getTenantSettings, updateTenantSettings } from '@/lib/tenant'
import { withTenant } from '@/lib/db'
import { updateSettingsSchema } from '@/lib/validations'
import { prismaRW } from '@/lib/db'
import { z } from 'zod'

// Payment settings schema
const paymentSettingsSchema = z.object({
  myfatoorahApiKey: z.string().optional(),
  myfatoorahSecretKey: z.string().optional(),
  myfatoorahIsTest: z.boolean().optional(),
  knetMerchantId: z.string().optional(),
  knetApiKey: z.string().optional(),
  knetIsTest: z.boolean().optional(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeIsTest: z.boolean().optional(),
})

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
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Check if this is a payment settings update
    if (paymentSettingsSchema.safeParse(body).success) {
      const paymentData = paymentSettingsSchema.parse(body)
      
      // Update tenant payment settings directly
      await prismaRW.tenant.update({
        where: { id: tenant.id },
        data: paymentData
      })
      
      // Return updated tenant data
      const updatedTenant = await prismaRW.tenant.findUnique({
        where: { id: tenant.id }
      })
      
      return NextResponse.json({ data: updatedTenant })
    }
    
    // Handle regular settings update
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
