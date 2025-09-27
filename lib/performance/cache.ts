/**
 * Performance Optimization - Caching System
 * 
 * Provides in-memory caching for frequently accessed data
 * to improve API response times and reduce database load.
 */

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanup();
  }

  set(key: string, value: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + this.config.ttl,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry has expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      age: number;
      accessCount: number;
      expiresIn: number;
    }>;
  } {
    const now = Date.now();
    let totalAccesses = 0;
    let totalHits = 0;

    const entries = Array.from(this.cache.entries()).map(([key, entry]) => {
      totalAccesses += entry.accessCount;
      if (entry.accessCount > 0) {
        totalHits += entry.accessCount;
      }

      return {
        key,
        age: now - entry.createdAt,
        accessCount: entry.accessCount,
        expiresIn: entry.expiresAt - now
      };
    });

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      entries
    };
  }
}

// Cache configurations for different data types
export const cacheConfigs = {
  // Short-term cache for frequently accessed data
  short: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    cleanupInterval: 60 * 1000 // 1 minute
  },

  // Medium-term cache for moderately accessed data
  medium: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 500,
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
  },

  // Long-term cache for rarely changing data
  long: {
    ttl: 2 * 60 * 60 * 1000, // 2 hours
    maxSize: 100,
    cleanupInterval: 15 * 60 * 1000 // 15 minutes
  }
};

// Global cache instances
export const caches = {
  tenant: new MemoryCache<any>(cacheConfigs.long),
  products: new MemoryCache<any[]>(cacheConfigs.medium),
  categories: new MemoryCache<any[]>(cacheConfigs.long),
  settings: new MemoryCache<any>(cacheConfigs.medium),
  user: new MemoryCache<any>(cacheConfigs.short)
};

// Cache key generators
export const cacheKeys = {
  tenant: (slug: string) => `tenant:${slug}`,
  tenantById: (id: string) => `tenant:id:${id}`,
  products: (tenantId: string, categoryId?: string) => 
    categoryId ? `products:${tenantId}:${categoryId}` : `products:${tenantId}`,
  categories: (tenantId: string) => `categories:${tenantId}`,
  settings: (tenantId: string) => `settings:${tenantId}`,
  user: (userId: string) => `user:${userId}`
};

// Cache helper functions
export function getCachedOrFetch<T>(
  cache: MemoryCache<T>,
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fetchFn().then(value => {
    cache.set(key, value);
    return value;
  });
}

export function invalidateCachePattern(pattern: string): void {
  const regex = new RegExp(pattern);
  
  for (const cache of Object.values(caches)) {
    const stats = cache.getStats();
    for (const entry of stats.entries) {
      if (regex.test(entry.key)) {
        cache.delete(entry.key);
      }
    }
  }
}

// Cleanup function for graceful shutdown
export function cleanupCaches(): void {
  Object.values(caches).forEach(cache => cache.destroy());
}

