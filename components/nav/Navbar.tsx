import { getTenantBySlug } from '@/lib/firebase/tenant';
import { getTenantDocuments, COLLECTIONS } from '@/lib/firebase/db';
import ShopDropdown from './ShopDropdown';
import CartButton from '@/components/cart/CartButton';
import MobileMenu from './MobileMenu';

export const revalidate = 0;

interface NavbarProps {
  tenantSlug: string;
}

export default async function Navbar({ tenantSlug }: NavbarProps) {
  try {
    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) return null;

    const allCategories = await getTenantDocuments(COLLECTIONS.CATEGORIES, tenant.id);
    const categories = allCategories
      .sort((a: any, b: any) => {
        if (a.sortOrder !== b.sortOrder) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return (a.name || '').localeCompare(b.name || '');
      })
      .map((cat: any) => ({ name: cat.name, slug: cat.slug }));

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <nav className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo/Store Name */}
        <a 
          href={`/${tenantSlug}/retail`} 
          className="font-semibold text-lg hover:text-blue-600 transition-colors"
        >
          {tenant.name}
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <a 
            href={`/${tenantSlug}/retail`}
            className="hover:text-blue-600 transition-colors"
          >
            Home
          </a>
          <ShopDropdown tenantSlug={tenantSlug} categories={categories} />
          <a 
            href={`/${tenantSlug}/retail?tag=best`}
            className="hover:text-blue-600 transition-colors"
          >
            Best Sellers
          </a>
          <a 
            href={`/${tenantSlug}/retail?tag=new`}
            className="hover:text-blue-600 transition-colors"
          >
            New Arrivals
          </a>
          <a 
            href={`/${tenantSlug}/retail?tag=offer`}
            className="hover:text-blue-600 transition-colors"
          >
            Offers
          </a>
          <a 
            href={`/${tenantSlug}/about`}
            className="hover:text-blue-600 transition-colors"
          >
            About Us
          </a>
          <a 
            href={`/${tenantSlug}/contact`}
            className="hover:text-blue-600 transition-colors"
          >
            Contact Us
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <CartButton tenantSlug={tenantSlug} />
          <MobileMenu tenantSlug={tenantSlug} categories={categories} />
        </div>
      </nav>
    </header>
  );
  } catch (error) {
    console.error('Navbar error:', error);
    return null;
  }
}
