import { getTenantDocuments } from "@/lib/db";
import { NextRequest } from "next/server";

export interface TenantUser {
  userId: string;
  tenantId: string;
  role: "OWNER" | "ADMIN" | "STAFF";
}

export async function requireTenantAndRole(
  request: NextRequest,
  tenantSlug: string,
  allowedRoles: ("OWNER" | "ADMIN" | "STAFF")[] = ["OWNER", "ADMIN"]
): Promise<TenantUser> {
  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  // TODO: Replace with actual auth implementation
  // For now, return a mock user for development
  const mockUser: TenantUser = {
    userId: "mock-user-id",
    tenantId: tenant.id,
    role: "OWNER",
  };

  // Check if user has required role
  if (!allowedRoles.includes(mockUser.role)) {
    throw new Error("Insufficient permissions");
  }

  return mockUser;
}

export async function getTenantUser(
  tenantSlug: string,
  userId?: string
): Promise<TenantUser | null> {
  if (!userId) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) return null;

  // TODO: Replace with actual auth implementation
  // For now, return a mock user for development
  return {
    userId,
    tenantId: tenant.id,
    role: "OWNER",
  };
}
