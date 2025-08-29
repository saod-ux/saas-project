import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prismaRW: PrismaClient | undefined
  prismaRO: PrismaClient | undefined
}

// Primary read-write client
export const prismaRW = globalForPrisma.prismaRW ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Read-only client (falls back to RW if READONLY_DATABASE_URL not set)
export const prismaRO = globalForPrisma.prismaRO ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.READONLY_DATABASE_URL || process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaRW = prismaRW
  globalForPrisma.prismaRO = prismaRO
}

// Helper to execute queries with tenant context in RW transaction
export async function withTenantRW<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return prismaRW.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_tenant_id(${tenantId})`
    return fn(tx as unknown as PrismaClient)
  })
}

// Helper to execute queries with tenant context in RO transaction
export async function withTenantRO<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return prismaRO.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_tenant_id(${tenantId})`
    return fn(tx as unknown as PrismaClient)
  })
}

// Legacy helper for backward compatibility
export async function withTenant<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return withTenantRW(tenantId, fn)
}

// Lightweight wrappers that run each call in its own tenant-scoped transaction
export function getTenantPrisma(tenantId: string) {
  return {
    product: {
      findMany: async (args?: any) => withTenantRO(tenantId, (tx) => (tx as any).product.findMany(args)),
      findUnique: async (args: any) => withTenantRO(tenantId, (tx) => (tx as any).product.findUnique(args)),
      count: async (args?: any) => withTenantRO(tenantId, (tx) => (tx as any).product.count(args)),
      create: async (args: any) => withTenantRW(tenantId, (tx) => (tx as any).product.create(args)),
      update: async (args: any) => withTenantRW(tenantId, (tx) => (tx as any).product.update(args)),
      delete: async (args: any) => withTenantRW(tenantId, (tx) => (tx as any).product.delete(args)),
    },
    order: {
      findMany: async (args?: any) => withTenantRO(tenantId, (tx) => (tx as any).order.findMany(args)),
      findUnique: async (args: any) => withTenantRO(tenantId, (tx) => (tx as any).order.findUnique(args)),
      count: async (args?: any) => withTenantRO(tenantId, (tx) => (tx as any).order.count(args)),
      create: async (args: any) => withTenantRW(tenantId, (tx) => (tx as any).order.create(args)),
      update: async (args: any) => withTenantRW(tenantId, (tx) => (tx as any).order.update(args)),
    },
    tenant: {
      findUnique: async (args: any) => withTenantRO(tenantId, (tx) => (tx as any).tenant.findUnique(args)),
      update: async (args: any) => withTenantRW(tenantId, (tx) => (tx as any).tenant.update(args)),
    },
  }
}

// Export legacy prisma for backward compatibility
export const prisma = prismaRW
