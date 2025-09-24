import { getTenantDocuments } from '@/lib/db'
import { getTenantBySlug } from '@/lib/firebase/tenant'

export interface AdminApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Base fetcher for admin API calls with tenant context
 */
export async function adminFetch<T = any>(
  url: string,
  options: RequestInit = {},
  tenantSlug: string
): Promise<AdminApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-slug': tenantSlug,
        ...options.headers,
      },
      cache: 'no-store',
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'Request failed',
      }
    }

    return {
      ok: true,
      data: data.data,
      message: data.message,
    }
  } catch (error) {
    console.error('Admin fetch error:', error)
    return {
      ok: false,
      error: 'Network error',
    }
  }
}

/**
 * Get tenant info for admin context
 */
export async function getTenantForAdmin(tenantSlug: string) {
  try {
    const tenant = await getTenantBySlug(tenantSlug)

    if (!tenant) {
      return null
    }

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      template: tenant.template as 'RESTAURANT' | 'RETAIL',
      status: tenant.status,
      settingsJson: tenant.settingsJson,
    }
  } catch (error) {
    console.error('Error fetching tenant for admin:', error)
    return null
  }
}

/**
 * Validate tenant exists and is active
 */
export async function validateTenant(tenantSlug: string) {
  const tenant = await getTenantForAdmin(tenantSlug)
  
  if (!tenant) {
    throw new Error('Tenant not found')
  }

  if (tenant.status !== 'ACTIVE') {
    throw new Error('Tenant is not active')
  }

  return tenant
}

/**
 * Generic CRUD operations for admin
 */
export class AdminCrud {
  constructor(private tenantSlug: string) {}

  async create<T>(endpoint: string, data: any): Promise<AdminApiResponse<T>> {
    return adminFetch(`/api/admin/${this.tenantSlug}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, this.tenantSlug)
  }

  async update<T>(endpoint: string, data: any): Promise<AdminApiResponse<T>> {
    return adminFetch(`/api/admin/${this.tenantSlug}${endpoint}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, this.tenantSlug)
  }

  async delete<T>(endpoint: string): Promise<AdminApiResponse<T>> {
    return adminFetch(`/api/admin/${this.tenantSlug}${endpoint}`, {
      method: 'DELETE',
    }, this.tenantSlug)
  }

  async get<T>(endpoint: string): Promise<AdminApiResponse<T>> {
    return adminFetch(`/api/admin/${this.tenantSlug}${endpoint}`, {
      method: 'GET',
    }, this.tenantSlug)
  }
}




