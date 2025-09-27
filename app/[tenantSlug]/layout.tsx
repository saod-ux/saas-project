import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTenantBySlug } from "@/lib/services/tenant";
import { getServerDb } from "@/lib/firebase/db";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";

// Disable caching to ensure fresh tenant data
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  const baseUrl = 'http://localhost:3000';
  const canonicalUrl = `${baseUrl}/${tenantSlug}`;
  const title = `${tenantSlug} - Online Store`;
  const description = `Shop at ${tenantSlug} for quality products and great deals.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: tenantSlug,
      images: ['/default-og-image.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/default-og-image.jpg'],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function StorefrontLayout({ params, children }:{
  params: Promise<{ tenantSlug: string }>;
  children: React.ReactNode;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Get fresh tenant data including settings
  let freshLogoUrl: string | null = tenant.logoUrl || null;
  let tenantSettings: any = {};
  try {
    const dbFresh = await getServerDb();
    const freshDoc = await dbFresh.collection('tenants').doc(tenant.id).get();
    if (freshDoc.exists) {
      const freshData = freshDoc.data() as any;
      freshLogoUrl = freshData?.logoUrl ?? null;
      
      // Extract settings from the tenant document
      tenantSettings = {
        social: freshData?.['settings.social'] || freshData?.settings?.social || {}
      };
    }
  } catch (e) {
    // keep prior tenant.logoUrl if direct fetch fails
  }

  // Get platform content
  let platformContent = null;
  try {
    const db = await getServerDb();
    const merchantContentDoc = await db.collection('merchant-content').doc(tenant.id).get();
    if (merchantContentDoc.exists) {
      const merchantData = merchantContentDoc.data();
      platformContent = {
        policies: merchantData?.policies
      };
    }
    if (!platformContent) {
      const platformContentDoc = await db.collection('platform').doc('content-settings').get();
      if (platformContentDoc.exists) {
        const platformData = platformContentDoc.data();
        platformContent = {
          policies: platformData?.policies
        };
      }
    }
  } catch (error) {
    console.error("Error fetching content settings:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StorefrontHeader 
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: freshLogoUrl
        }} 
        tenantSlug={tenantSlug} 
      />
      <main className="flex-1">
        {children}
      </main>
      <StorefrontFooter 
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: freshLogoUrl,
          settings: tenantSettings
        }} 
        tenantSlug={tenantSlug} 
        platformContent={platformContent} 
      />
    </div>
  );
}