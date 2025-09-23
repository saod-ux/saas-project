import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getServerDb } from "@/lib/firebase/db";
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  params,
  children,
}: {
  params: Promise<{ tenantSlug: string }>;
  children: React.ReactNode;
}) {
  const { tenantSlug } = await params;
  
  // Get tenant from Firebase
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return notFound();

  // Force fresh read of tenant document to ensure latest logoUrl persists in admin
  let freshLogoUrl: string | null = tenant.logoUrl || null;
  try {
    const db = await getServerDb();
    const freshDoc = await db.collection('tenants').doc(tenant.id).get();
    if (freshDoc.exists) {
      const data = freshDoc.data() as any;
      freshLogoUrl = data?.logoUrl ?? null;
    }
  } catch (e) {
    // ignore, fall back to tenant.logoUrl
  }

  // TODO: Add proper authentication and role checking
  // For now, we'll allow access to all authenticated users

  return (
    <AdminLayoutClient 
      tenantSlug={tenantSlug} 
      tenantName={tenant.name || tenantSlug}
      logoUrl={freshLogoUrl}
    >
      {children}
    </AdminLayoutClient>
  );
}
