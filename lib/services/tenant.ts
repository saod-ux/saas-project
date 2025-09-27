// Centralized tenant resolution service
// Server-only usage; safe to import in route handlers and server components

import { getTenantBySlug as firestoreGetTenantBySlug } from '@/lib/firebase/tenant'
import { caches, cacheKeys, getCachedOrFetch } from '@/lib/performance/cache'

export async function getTenantBySlug(slug: string) {
  const normalized = (slug || '').toLowerCase()
  const cacheKey = cacheKeys.tenant(normalized)
  
  return getCachedOrFetch(
    caches.tenant,
    cacheKey,
    () => firestoreGetTenantBySlug(normalized)
  )
}

export async function resolveTenantBySlug(slug: string) {
  if (!slug) return null
  return await getTenantBySlug(slug)
}


