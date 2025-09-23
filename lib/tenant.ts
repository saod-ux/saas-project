import { getTenantBySlug, getTenantById, updateTenant } from './firebase/tenant'
import { getTenantDocuments, COLLECTIONS } from './db'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  domain?: string | null
  settingsJson: any
  // Payment fields from Firestore
  myfatoorahApiKey?: string | null
  myfatoorahSecretKey?: string | null
  myfatoorahIsTest?: boolean
  knetMerchantId?: string | null
  knetApiKey?: string | null
  knetIsTest?: boolean
  stripePublishableKey?: string | null
  stripeSecretKey?: string | null
  stripeIsTest?: boolean
  settingsVersion?: number
}

// Note: Custom domain resolution is now handled via /api/_domain-lookup
// to avoid Firestore usage in Edge runtime middleware

export async function resolveTenantBySlug(slug: string): Promise<TenantInfo | null> {
  if (!slug) return null
  const tenant = await getTenantBySlug(slug.toLowerCase())
  return tenant
}

export async function validateTenantAccess(tenantId: string, userId?: string): Promise<boolean> {
  if (!userId) {
    return true
  }
  
  const memberships = await getTenantDocuments(COLLECTIONS.MEMBERSHIPS, tenantId)
  const membership = memberships.find(m => m.userId === userId)
  
  return !!membership
}

export async function getTenantSettings(tenantId: string): Promise<any> {
  const tenant = await getTenantById(tenantId)
  return tenant?.settingsJson || {}
}

export async function updateTenantSettings(tenantId: string, settings: any): Promise<void> {
  await updateTenant(tenantId, { settingsJson: settings })
}
