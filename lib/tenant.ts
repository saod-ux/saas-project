import { prisma } from './db'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  domain?: string | null
  settingsJson: any
}

// Extract tenant slug from hostname
export function extractTenantSlug(host: string): string | null {
  const hostname = (host || '').split(':')[0].toLowerCase()
  if (!hostname) return null

  const parts = hostname.split('.')

  // Handle dev subdomains like acme.localhost or moka.localhost
  const isLocalhost = parts.includes('localhost')
  if (isLocalhost && parts.length >= 2) {
    return parts[0] || null
  }

  // If custom domain (no subdomain), return null so we resolve by domain
  if (parts.length === 2) {
    return null
  }

  // For domains like tenant.yourapp.com (3+ parts), use first segment
  if (parts.length >= 3) {
    return parts[0]
  }

  return null
}

// Resolve tenant by slug or domain
export async function resolveTenant(host: string): Promise<TenantInfo | null> {
  const hostname = (host || '').split(':')[0].toLowerCase()
  const tenantSlug = extractTenantSlug(hostname)
  
  if (!tenantSlug) {
    // Try to find by custom domain
    const tenant = await prisma.tenant.findFirst({
      where: {
        domain: hostname
      }
    })
    return tenant
  }
  
  // Find by slug
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: tenantSlug
    }
  })
  
  return tenant
}

export async function resolveTenantBySlug(slug: string): Promise<TenantInfo | null> {
  if (!slug) return null
  const tenant = await prisma.tenant.findUnique({ where: { slug: slug.toLowerCase() } })
  return tenant
}

export async function validateTenantAccess(tenantId: string, userId?: string): Promise<boolean> {
  if (!userId) {
    return true
  }
  
  const membership = await prisma.membership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId
      }
    }
  })
  
  return !!membership
}

export async function getTenantSettings(tenantId: string): Promise<any> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settingsJson: true }
  })
  
  return tenant?.settingsJson || {}
}

export async function updateTenantSettings(tenantId: string, settings: any): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { settingsJson: settings }
  })
}
