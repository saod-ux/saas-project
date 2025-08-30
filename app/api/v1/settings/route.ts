import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant, getTenantSettings, updateTenantSettings } from '@/lib/tenant'
import { withTenant } from '@/lib/db'
import { prismaRW } from '@/lib/db'
import { 
  tenantSettingsSchema, 
  upgradeSettings, 
  defaultSettings,
  type TenantSettings 
} from '@/lib/settings'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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
    
    // Get settings from both settingsJson and direct fields
    const settingsJson = await withTenant(tenant.id, async () => getTenantSettings(tenant.id))
    
    // Get tenant with all fields
    const tenantWithFields = await prismaRW.tenant.findUnique({
      where: { id: tenant.id }
    })
    
    if (!tenantWithFields) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    // Merge settingsJson with direct fields
    const mergedSettings = {
      ...settingsJson,
      // Direct fields from tenant model
      primary: tenantWithFields.primary,
      accent: tenantWithFields.accent,
      bg: tenantWithFields.bg,
      card: tenantWithFields.card,
      text: tenantWithFields.text,
      logoUrl: tenantWithFields.logoUrl,
      showHero: tenantWithFields.showHero,
      heroTitle: tenantWithFields.heroTitle,
      heroSubtitle: tenantWithFields.heroSubtitle,
      heroCtaLabel: tenantWithFields.heroCtaLabel,
      heroCtaHref: tenantWithFields.heroCtaHref,
      heroImageUrl: tenantWithFields.heroImageUrl,
      direction: tenantWithFields.direction,
      locale: tenantWithFields.locale,
      settingsVersion: tenantWithFields.settingsVersion,
      // Payment fields
      myfatoorahApiKey: tenantWithFields.myfatoorahApiKey,
      myfatoorahSecretKey: tenantWithFields.myfatoorahSecretKey,
      myfatoorahIsTest: tenantWithFields.myfatoorahIsTest,
      knetMerchantId: tenantWithFields.knetMerchantId,
      knetApiKey: tenantWithFields.knetApiKey,
      knetIsTest: tenantWithFields.knetIsTest,
      stripePublishableKey: tenantWithFields.stripePublishableKey,
      stripeSecretKey: tenantWithFields.stripeSecretKey,
      stripeIsTest: tenantWithFields.stripeIsTest,
    }
    
    // Upgrade and validate settings
    const upgradedSettings = upgradeSettings(mergedSettings)
    
    return NextResponse.json({ data: upgradedSettings })
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
    
    // Validate the incoming data
    const validatedData = tenantSettingsSchema.partial().parse(body)
    
    // Prepare update data for direct fields
    const directFields: any = {}
    
    // Storefront theme fields
    if (validatedData.storefront?.theme) {
      Object.assign(directFields, {
        primary: validatedData.storefront.theme.primary,
        accent: validatedData.storefront.theme.accent,
        bg: validatedData.storefront.theme.bg,
        card: validatedData.storefront.theme.card,
        text: validatedData.storefront.theme.text,
        logoUrl: validatedData.storefront.theme.logoUrl,
      })
    }
    
    // Hero fields
    if (validatedData.storefront?.hero) {
      Object.assign(directFields, {
        showHero: validatedData.storefront.hero.showHero,
        heroTitle: validatedData.storefront.hero.heroTitle,
        heroSubtitle: validatedData.storefront.hero.heroSubtitle,
        heroCtaLabel: validatedData.storefront.hero.heroCtaLabel,
        heroCtaHref: validatedData.storefront.hero.heroCtaHref,
        heroImageUrl: validatedData.storefront.hero.heroImageUrl,
      })
    }
    
    // Localization fields
    if (validatedData.storefront?.localization) {
      Object.assign(directFields, {
        direction: validatedData.storefront.localization.direction,
        locale: validatedData.storefront.localization.locale,
      })
    }
    
    // Payment fields
    if (validatedData.payment) {
      Object.assign(directFields, {
        myfatoorahApiKey: validatedData.payment.myfatoorahApiKey,
        myfatoorahSecretKey: validatedData.payment.myfatoorahSecretKey,
        myfatoorahIsTest: validatedData.payment.myfatoorahIsTest,
        knetMerchantId: validatedData.payment.knetMerchantId,
        knetApiKey: validatedData.payment.knetApiKey,
        knetIsTest: validatedData.payment.knetIsTest,
        stripePublishableKey: validatedData.payment.stripePublishableKey,
        stripeSecretKey: validatedData.payment.stripeSecretKey,
        stripeIsTest: validatedData.payment.stripeIsTest,
      })
    }
    
    // Version
    if (validatedData.settingsVersion) {
      directFields.settingsVersion = validatedData.settingsVersion
    }
    
    // Update direct fields in tenant table
    if (Object.keys(directFields).length > 0) {
      await prismaRW.tenant.update({
        where: { id: tenant.id },
        data: directFields
      })
    }
    
    // Update settingsJson for other fields
    const currentSettingsJson = await getTenantSettings(tenant.id)
    const updatedSettingsJson = { ...currentSettingsJson, ...validatedData }
    
    // Remove direct fields from settingsJson to avoid duplication
    const fieldsToRemove = [
      'primary', 'accent', 'bg', 'card', 'text', 'logoUrl',
      'showHero', 'heroTitle', 'heroSubtitle', 'heroCtaLabel', 'heroCtaHref', 'heroImageUrl',
      'direction', 'locale', 'settingsVersion',
      'myfatoorahApiKey', 'myfatoorahSecretKey', 'myfatoorahIsTest',
      'knetMerchantId', 'knetApiKey', 'knetIsTest',
      'stripePublishableKey', 'stripeSecretKey', 'stripeIsTest',
    ]
    
    fieldsToRemove.forEach(field => {
      delete updatedSettingsJson[field]
    })
    
    await withTenant(tenant.id, async () => updateTenantSettings(tenant.id, updatedSettingsJson))
    
    // Revalidate storefront pages
    revalidatePath('/')
    revalidatePath('/product/[id]')
    
    // Return updated settings
    const updatedTenant = await prismaRW.tenant.findUnique({
      where: { id: tenant.id }
    })
    
    const mergedSettings = {
      ...updatedSettingsJson,
      primary: updatedTenant?.primary,
      accent: updatedTenant?.accent,
      bg: updatedTenant?.bg,
      card: updatedTenant?.card,
      text: updatedTenant?.text,
      logoUrl: updatedTenant?.logoUrl,
      showHero: updatedTenant?.showHero,
      heroTitle: updatedTenant?.heroTitle,
      heroSubtitle: updatedTenant?.heroSubtitle,
      heroCtaLabel: updatedTenant?.heroCtaLabel,
      heroCtaHref: updatedTenant?.heroCtaHref,
      heroImageUrl: updatedTenant?.heroImageUrl,
      direction: updatedTenant?.direction,
      locale: updatedTenant?.locale,
      settingsVersion: updatedTenant?.settingsVersion,
      myfatoorahApiKey: updatedTenant?.myfatoorahApiKey,
      myfatoorahSecretKey: updatedTenant?.myfatoorahSecretKey,
      myfatoorahIsTest: updatedTenant?.myfatoorahIsTest,
      knetMerchantId: updatedTenant?.knetMerchantId,
      knetApiKey: updatedTenant?.knetApiKey,
      knetIsTest: updatedTenant?.knetIsTest,
      stripePublishableKey: updatedTenant?.stripePublishableKey,
      stripeSecretKey: updatedTenant?.stripeSecretKey,
      stripeIsTest: updatedTenant?.stripeIsTest,
    }
    
    const finalSettings = upgradeSettings(mergedSettings)
    
    return NextResponse.json({ data: finalSettings })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
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
