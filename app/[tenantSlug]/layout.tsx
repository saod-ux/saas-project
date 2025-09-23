import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getServerDb } from "@/lib/firebase/db";
import Footer from "@/components/store/Footer";
import { TenantRTLProvider } from "@/components/providers/TenantRTLProvider";
import { CustomerProvider } from "@/contexts/CustomerContext";
import CartIcon from "@/components/store/CartIcon";
import LanguageToggle from "@/components/store/LanguageToggle";
import HeaderSearch from "@/components/store/HeaderSearch";
import MobileBottomNav from "@/components/store/MobileBottomNav";
import CustomerAuthButton from "@/components/storefront/CustomerAuthButton";

// Disable caching to ensure fresh tenant data
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: {
  params: Promise<{ tenantSlug: string }>;
}): Promise<Metadata> {
  const { tenantSlug } = await params;
  // const tenant = await loadTenantBySlug(tenantSlug);
  
  // if (!tenant) {
  //   return {
  //     title: "Store Not Found",
  //     description: "The requested store could not be found.",
  //   };
  // }

  // Check for custom domain (stored directly on tenant)
  // const customDomain = tenant.domain ? { domain: tenant.domain } : null;

  const baseUrl = 'http://localhost:3000';
  const canonicalUrl = `${baseUrl}/${tenantSlug}`;

  // const seoSettings = tenant.settings?.seo || {};
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

export default async function TenantLayout({ params, children }:{
  params: Promise<{ tenantSlug: string }>;
  children: React.ReactNode;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  
  if (!tenant) {
    return notFound();
  }

  // Force-read fresh tenant doc to ensure latest logoUrl (mirrors hero persistence)
  let freshLogoUrl: string | null = tenant.logoUrl || null;
  try {
    const dbFresh = await getServerDb();
    const freshDoc = await dbFresh.collection('tenants').doc(tenant.id).get();
    if (freshDoc.exists) {
      const freshData = freshDoc.data() as any;
      freshLogoUrl = freshData?.logoUrl ?? null;
    }
  } catch (e) {
    // keep prior tenant.logoUrl if direct fetch fails
  }

  // Get content settings (merchant override first, then platform default)
  let platformContent = null;
  try {
    const db = await getServerDb();
    
    // First, check for merchant-specific content override
    const merchantContentDoc = await db.collection('merchant-content').doc(tenant.id).get();
    if (merchantContentDoc.exists) {
      const merchantData = merchantContentDoc.data();
      platformContent = {
        hero: merchantData?.hero,
        policies: merchantData?.policies
      };
    }
    
    // If no merchant override, check platform settings
    if (!platformContent) {
      const platformContentDoc = await db.collection('platform').doc('content-settings').get();
      if (platformContentDoc.exists) {
        const platformData = platformContentDoc.data();
        platformContent = {
          hero: platformData?.hero,
          policies: platformData?.policies
        };
      }
    }
  } catch (error) {
    console.error("Error fetching content settings:", error);
  }

  // Determine locale and direction from tenant settings
  const locale = 'en-US';
  const direction = 'ltr';
  
  return (
    <TenantRTLProvider locale={locale} direction={direction}>
      <CustomerProvider tenantSlug={tenantSlug}>
        <div className="min-h-dvh bg-neutral-50">
          <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-sm" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
              {/* Left: Logo + Name */}
              <a href={`/${tenantSlug}/retail`} className="flex items-center gap-4 group">
                <div
                  className="relative shrink-0 rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden transition-all duration-200 group-hover:shadow-md group-hover:scale-105"
                  style={{ width: 44, height: 44 }}
                  aria-label={tenantSlug}
                >
                  {freshLogoUrl ? (
                    <img 
                      src={freshLogoUrl} 
                      alt={tenant.name || tenantSlug} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-sm font-bold text-gray-800 bg-gradient-to-br from-gray-100 to-gray-200">
                      {tenantSlug.slice(0,2).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="font-bold text-xl text-gray-900 group-hover:text-gray-700 transition-colors">
                  {tenant.name || tenantSlug}
                </span>
              </a>

              {/* Right: Search, Account, Cart, Language */}
              <div className="flex items-center gap-1">
                <HeaderSearch tenantSlug={tenantSlug} />
                <CustomerAuthButton tenantSlug={tenantSlug} />
                <CartIcon />
                <LanguageToggle />
              </div>
            </div>
          </header>
          <main>{children}</main>
          {/* Mobile Bottom Navigation */}
          <MobileBottomNav tenantSlug={tenantSlug} />
          <Footer tenantSlug={tenantSlug} tenant={null} platformContent={platformContent} />
        </div>
      </CustomerProvider>
    </TenantRTLProvider>
  );
}