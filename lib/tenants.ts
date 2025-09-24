import { getTenantDocuments, createDocument, updateDocument } from '@/lib/db'

export interface TenantInfo {
  id: string
  slug: string
  name: string
  template: string
  status: string
  settingsJson?: any
}

/**
 * Get tenant by slug from the database
 * @param slug - The tenant slug to look up
 * @returns Tenant info or null if not found
 */
export async function getTenantBySlug(slug: string): Promise<TenantInfo | null> {
  const normalized = (slug || '').toLowerCase()
  const attempts = 3
  const delayMs = 120

  for (let i = 1; i <= attempts; i++) {
    try {
      const tenants = await getTenantDocuments('tenants', '')
      const tenant = tenants.find((t: any) => t.slug === normalized)

      if (tenant) {
        return {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          template: tenant.template,
          status: tenant.status,
          settingsJson: tenant.settings,
        }
      }

      // Not found - break early (no retry helps for true 404)
      if (i === 1) {
        console.warn('[TENANT] Not found by slug on first attempt:', normalized)
      }
      return null
    } catch (error) {
      console.error(`[TENANT] Error fetching by slug (attempt ${i}/${attempts}):`, error)
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      return null
    }
  }

  return null
}

/**
 * Get tenant by ID from the database
 * @param id - The tenant ID to look up
 * @returns Tenant info or null if not found
 */
export async function getTenantById(id: string): Promise<TenantInfo | null> {
  try {
    const tenants = await getTenantDocuments('tenants', '')
    const tenant = tenants.find((t: any) => t.id === id)

    if (!tenant) {
      return null
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      template: tenant.template,
      status: tenant.status,
      settingsJson: tenant.settings,
    }
  } catch (error) {
    console.error('Error fetching tenant by ID:', error)
    return null
  }
}

/**
 * Update tenant template
 * @param tenantId - The tenant ID to update
 * @param template - The new template
 * @returns Updated tenant info or null if not found
 */
export async function updateTenantTemplate(
  tenantId: string, 
  template: 'RESTAURANT' | 'RETAIL'
): Promise<TenantInfo | null> {
  try {
    await updateDocument('tenants', tenantId, { template })
    
    // Fetch the updated tenant
    const updatedTenant = await getTenantById(tenantId)
    if (!updatedTenant) return null

    return {
      id: updatedTenant.id,
      slug: updatedTenant.slug,
      name: updatedTenant.name,
      template: updatedTenant.template as 'RESTAURANT' | 'RETAIL',
      status: updatedTenant.status,
      settingsJson: updatedTenant.settingsJson,
    }
  } catch (error) {
    console.error('Error updating tenant template:', error)
    return null
  }
}

/**
 * Create a new tenant
 * @param data - Tenant creation data
 * @returns Created tenant info or null if creation failed
 */
export async function createTenant(data: {
  name: string
  slug: string
  template: 'RESTAURANT' | 'RETAIL'
}): Promise<TenantInfo | null> {
  try {
    const tenantData = {
      name: data.name,
      slug: data.slug,
      template: data.template,
      status: 'ACTIVE',
      settings: {
        template: data.template.toLowerCase(),
        branding: {
          storeName: data.name,
          logoUrl: null,
          faviconUrl: null,
          primaryColor: data.template === 'RESTAURANT' ? '#dc2626' : '#2563eb',
          accentColor: data.template === 'RESTAURANT' ? '#f59e0b' : '#7c3aed'
        },
        hero: {
          title: `Welcome to ${data.name}`,
          subtitle: data.template === 'RESTAURANT' ? 'Delicious food delivered to your door' : 'Discover amazing products',
          ctaLabel: data.template === 'RESTAURANT' ? 'Order Now' : 'Shop Now',
          imageUrl: null
        },
        ui: {
          locale: 'en',
          currency: 'KWD',
          showCategories: true,
          showPriceFilter: data.template === 'RETAIL',
          showSort: data.template === 'RETAIL',
          placeholderStyle: data.template === 'RESTAURANT' ? 'box' : 'grid'
        },
        links: {
          header: data.template === 'RESTAURANT' ? ['Menu', 'About', 'Contact'] : ['Products', 'Categories', 'About'],
          footer: {
            left: ['Privacy Policy', 'Terms of Service'],
            social: ['Instagram', 'Facebook', 'Twitter']
          }
        },
        policies: {
          returns: data.template === 'RESTAURANT' ? 'No returns on food items' : '30-day return policy',
          shipping: data.template === 'RESTAURANT' ? 'Free delivery on orders over 10 KWD' : 'Free shipping on orders over 25 KWD'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const tenant = await createDocument('tenants', tenantData)

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      template: tenant.template,
      status: tenant.status,
      settingsJson: tenant.settings,
    }
  } catch (error) {
    console.error('Error creating tenant:', error)
    return null
  }
}

/**
 * Check if a tenant slug is available
 * @param slug - The slug to check
 * @param excludeId - Optional tenant ID to exclude from check (for updates)
 * @returns True if slug is available
 */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  try {
    const tenants = await getTenantDocuments('tenants', '')
    const existing = tenants.find((t: any) => 
      t.slug === slug && (!excludeId || t.id !== excludeId)
    )

    return !existing
  } catch (error) {
    console.error('Error checking slug availability:', error)
    return false
  }
}
