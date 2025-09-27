export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server'
import { updateTenant } from '@/lib/firebase/tenant'
import { getTenantBySlug } from '@/lib/services/tenant'
import { revalidatePath } from 'next/cache'

// Target settings shape helpers
function toTargetShape(tenant: any, raw: any) {
  const v = raw || {}
  return {
    branding: {
      storeName: v.branding?.storeName ?? tenant.name ?? 'Store',
      logoUrl: v.branding?.logoUrl ?? null,
      faviconUrl: v.branding?.faviconUrl ?? null,
      primaryColor: v.branding?.primaryColor ?? '#1F2937',
      accentColor: v.branding?.accentColor ?? '#111827',
    },
    hero: {
      title: v.hero?.title ?? '',
      subtitle: v.hero?.subtitle ?? '',
      ctaLabel: v.hero?.ctaLabel ?? '',
      imageUrl: v.hero?.imageUrl ?? null,
    },
    ui: {
      locale: (v.ui?.locale === 'ar' ? 'ar' : 'en') as 'en' | 'ar',
      currency: v.ui?.currency ?? 'KWD',
      showCategories: v.ui?.showCategories ?? true,
      showPriceFilter: v.ui?.showPriceFilter ?? true,
      showSort: v.ui?.showSort ?? true,
      placeholderStyle: (v.ui?.placeholderStyle === 'grid' || v.ui?.placeholderStyle === 'abstract') ? v.ui.placeholderStyle : 'box',
    },
    links: {
      header: Array.isArray(v.links?.header) ? v.links.header : [],
      footer: {
        left: Array.isArray(v.links?.footer?.left) ? v.links.footer.left : [],
        social: Array.isArray(v.links?.footer?.social) ? v.links.footer.social : [],
      }
    },
    policies: {
      returns: v.policies?.returns ?? '',
      shipping: v.policies?.shipping ?? '',
    }
  }
}

function deepMerge(target: any, source: any) {
  if (source === null || source === undefined) return target
  if (typeof source !== 'object') return source
  if (Array.isArray(source)) return source.slice()
  const out: any = Array.isArray(target) ? [] : { ...(target || {}) }
  for (const key of Object.keys(source)) {
    const sVal = source[key]
    const tVal = out[key]
    if (sVal && typeof sVal === 'object' && !Array.isArray(sVal)) {
      out[key] = deepMerge(tVal, sVal)
    } else {
      out[key] = sVal
    }
  }
  return out
}

function sanitizeIncoming(body: any) {
  const clean: any = {}
  if (body.branding) {
    clean.branding = {}
    if ('storeName' in body.branding) clean.branding.storeName = body.branding.storeName
    if ('logoUrl' in body.branding) clean.branding.logoUrl = body.branding.logoUrl
    if ('faviconUrl' in body.branding) clean.branding.faviconUrl = body.branding.faviconUrl
    if ('primaryColor' in body.branding) clean.branding.primaryColor = body.branding.primaryColor
    if ('accentColor' in body.branding) clean.branding.accentColor = body.branding.accentColor
  }
  if (body.hero) {
    clean.hero = {}
    if ('title' in body.hero) clean.hero.title = body.hero.title
    if ('subtitle' in body.hero) clean.hero.subtitle = body.hero.subtitle
    if ('ctaLabel' in body.hero) clean.hero.ctaLabel = body.hero.ctaLabel
    if ('imageUrl' in body.hero) clean.hero.imageUrl = body.hero.imageUrl
  }
  if (body.ui) {
    clean.ui = {}
    if ('locale' in body.ui) clean.ui.locale = body.ui.locale === 'ar' ? 'ar' : 'en'
    if ('currency' in body.ui) clean.ui.currency = body.ui.currency
    if ('showCategories' in body.ui) clean.ui.showCategories = !!body.ui.showCategories
    if ('showPriceFilter' in body.ui) clean.ui.showPriceFilter = !!body.ui.showPriceFilter
    if ('showSort' in body.ui) clean.ui.showSort = !!body.ui.showSort
    if ('placeholderStyle' in body.ui) clean.ui.placeholderStyle = ['box', 'grid', 'abstract'].includes(body.ui.placeholderStyle) ? body.ui.placeholderStyle : undefined
    if (clean.ui.placeholderStyle === undefined && 'placeholderStyle' in body.ui) delete clean.ui.placeholderStyle
  }
  if (body.links) {
    clean.links = {}
    if ('header' in body.links) clean.links.header = Array.isArray(body.links.header) ? body.links.header : []
    if ('footer' in body.links) {
      clean.links.footer = {}
      if ('left' in body.links.footer) clean.links.footer.left = Array.isArray(body.links.footer.left) ? body.links.footer.left : []
      if ('social' in body.links.footer) clean.links.footer.social = Array.isArray(body.links.footer.social) ? body.links.footer.social : []
    }
  }
  if (body.policies) {
    clean.policies = {}
    if ('returns' in body.policies) clean.policies.returns = body.policies.returns
    if ('shipping' in body.policies) clean.policies.shipping = body.policies.shipping
  }
  return clean
}

// GET /api/v1/settings - Get tenant settings (target shape)
export async function GET(request: NextRequest) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json({ error: 'Tenant slug required' }, { status: 400 })
    }

    const tenant = await getTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const currentSettings = tenant.settings || {}
    const data = toTargetShape(tenant, currentSettings)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/v1/settings - Deep-merge updates into settings (target shape)
export async function PATCH(request: NextRequest) {
  try {
    const tenantSlug = request.headers.get('x-tenant-slug')
    if (!tenantSlug) {
      return NextResponse.json({ error: 'Tenant slug required' }, { status: 400 })
    }

    const tenant = await getTenantBySlug(tenantSlug)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const clean = sanitizeIncoming(body)

    const current = tenant.settings || {}
    const merged = deepMerge(current, clean)

    const updated = await updateTenant(tenant.id, {
      settings: merged
    })

    // Revalidate tenant-specific storefront routes
    // Note: Next.js revalidatePath requires concrete paths; we revalidate home and product list page.
    revalidatePath(`/${tenant.slug}`)

    const data = toTargetShape(updated, updated.settings)
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
