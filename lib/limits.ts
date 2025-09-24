import { getTenantDocuments } from '@/lib/db'

export interface PlanLimits {
  maxProducts: number
  maxCategories: number
  maxDomains: number
  maxStorage: number // in MB
  customDomain: boolean
  analytics: boolean
  prioritySupport: boolean
  apiAccess: boolean
  whiteLabel: boolean
}

export interface CurrentUsage {
  products: number
  categories: number
  domains: number
  storage: number // in MB
}

export async function getTenantLimits(tenantId: string): Promise<PlanLimits | null> {
  try {
    const subscriptions = await getTenantDocuments('subscriptions', '')
    const plans = await getTenantDocuments('plans', '')
    
    const subscription = subscriptions.find((s: any) => 
      s.tenantId === tenantId && s.status === 'active'
    )

    if (!subscription) {
      // Return default free plan limits
      return {
        maxProducts: 10,
        maxCategories: 5,
        maxDomains: 0,
        maxStorage: 100,
        customDomain: false,
        analytics: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false
      }
    }

    const plan = plans.find((p: any) => p.id === subscription.planId)
    if (!plan) {
      return {
        maxProducts: 10,
        maxCategories: 5,
        maxDomains: 0,
        maxStorage: 100,
        customDomain: false,
        analytics: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false
      }
    }

    return plan.features as unknown as PlanLimits
  } catch (error) {
    console.error('Error fetching tenant limits:', error)
    return null
  }
}

export async function getTenantUsage(tenantId: string): Promise<CurrentUsage> {
  try {
    const [allProducts, allCategories, allDomains] = await Promise.all([
      getTenantDocuments('products', ''),
      getTenantDocuments('categories', ''),
      getTenantDocuments('domains', '')
    ])

    const products = allProducts.filter((p: any) => p.tenantId === tenantId).length
    const categories = allCategories.filter((c: any) => c.tenantId === tenantId).length
    const domains = allDomains.filter((d: any) => d.tenantId === tenantId).length
    // Calculate storage usage (simplified - in real app, you'd sum actual file sizes)
    const storage = products * 0.5 // Assume 0.5MB per product

    return {
      products,
      categories,
      domains,
      storage
    }
  } catch (error) {
    console.error('Error fetching tenant usage:', error)
    return {
      products: 0,
      categories: 0,
      domains: 0,
      storage: 0
    }
  }
}

export async function checkLimit(
  tenantId: string, 
  resource: keyof CurrentUsage, 
  requestedAmount: number = 1
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const [limits, usage] = await Promise.all([
    getTenantLimits(tenantId),
    getTenantUsage(tenantId)
  ])

  if (!limits) {
    return {
      allowed: false,
      current: usage[resource],
      limit: 0,
      remaining: 0
    }
  }

  const limitKey = `max${resource.charAt(0).toUpperCase()}${resource.slice(1)}` as keyof PlanLimits
  const limit = limits[limitKey] as number
  const current = usage[resource]
  const remaining = Math.max(0, limit - current)
  const allowed = current + requestedAmount <= limit

  return {
    allowed,
    current,
    limit,
    remaining
  }
}

export async function enforceLimit(
  tenantId: string, 
  resource: keyof CurrentUsage, 
  requestedAmount: number = 1
): Promise<{ success: boolean; error?: string }> {
  const check = await checkLimit(tenantId, resource, requestedAmount)
  
  if (!check.allowed) {
    return {
      success: false,
      error: `Limit exceeded. You have ${check.remaining} ${resource} remaining out of ${check.limit} allowed.`
    }
  }

  return { success: true }
}

export function formatLimitMessage(limit: string, current: number, max: number): string {
  const remaining = Math.max(0, max - current)
  return `${limit}: ${current}/${max} (${remaining} remaining)`
}

