/**
 * Rate Limiting System
 * 
 * Provides configurable rate limiting for API endpoints with different strategies
 * for different types of operations (auth, general API, etc.).
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

// In-memory store for rate limiting (in production, use Redis)
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, count: number, resetTime: number): void {
    this.store.set(key, { count, resetTime });
  }

  increment(key: string, windowMs: number): number {
    const now = Date.now();
    const resetTime = now + windowMs;
    const entry = this.get(key);
    
    if (!entry) {
      this.set(key, 1, resetTime);
      return 1;
    }
    
    const newCount = entry.count + 1;
    this.set(key, newCount, entry.resetTime);
    return newCount;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const store = new RateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private generateKey(identifier: string, endpoint?: string): string {
    return endpoint ? `${identifier}:${endpoint}` : identifier;
  }

  check(identifier: string, endpoint?: string): RateLimitResult {
    const key = this.generateKey(identifier, endpoint);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;
    
    const entry = store.get(key);
    const currentCount = entry ? entry.count : 0;
    
    if (currentCount >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry?.resetTime || resetTime,
        totalHits: currentCount
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - currentCount - 1,
      resetTime: entry?.resetTime || resetTime,
      totalHits: currentCount
    };
  }

  hit(identifier: string, endpoint?: string): RateLimitResult {
    const key = this.generateKey(identifier, endpoint);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;
    
    const currentCount = store.increment(key, this.config.windowMs);
    
    if (currentCount > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        totalHits: currentCount
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - currentCount,
      resetTime,
      totalHits: currentCount
    };
  }
}

// Predefined rate limiters for different use cases
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  }),

  // Moderate rate limiting for general API endpoints
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
    message: 'Too many requests. Please slow down.'
  }),

  // Lenient rate limiting for public endpoints
  public: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes
    message: 'Rate limit exceeded. Please try again later.'
  }),

  // Very strict rate limiting for sensitive operations
  sensitive: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 attempts per hour
    message: 'Too many sensitive operations. Please try again later.'
  })
};

// Helper function to get client identifier
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwardedFor?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  // In production, you might want to hash the IP for privacy
  return ip;
}

// Helper function to create rate limit headers
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.totalHits.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'Retry-After': result.allowed ? '0' : Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  };
}

