import { getTenantDocuments } from "@/lib/db";
import { getTenantBySlug } from "@/lib/firebase/tenant";
import CategoriesClient from "./CategoriesClient";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import EmptyCompact from "@/components/ui/EmptyCompact";

export const revalidate = 0;

export default async function CategoriesPage({ params }:{ params: Promise<{tenantSlug:string}> }) {
  const { tenantSlug } = await params;
  
  try {
    const tenant = await getTenantBySlug(tenantSlug);
    
    if (!tenant) return <div>Tenant not found</div>;

    // Simple translation function
    const t = (key: string) => {
      const translations: Record<string, string> = {
        'categories.title': 'Browse by Category',
      };
      return translations[key] || key;
    };

    const cats = await getTenantDocuments('categories', tenant.id);
    const activeCats = cats
      .filter((cat: any) => cat.isActive !== false)
      .sort((a: any, b: any) => {
        if (a.sortOrder !== b.sortOrder) {
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        }
        return (a.name || '').localeCompare(b.name || '');
      });

    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Page Header */}
        <Section className="bg-white border-b">
          <Container>
            <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
          </Container>
        </Section>
        
        {/* Categories Content */}
        {activeCats.length > 0 ? (
          <CategoriesClient categories={activeCats} tenantSlug={tenantSlug} tenantLogo={tenant.logoUrl} />
        ) : (
          <Section>
            <Container>
              <EmptyCompact text="No categories available yet" />
            </Container>
          </Section>
        )}
      </div>
    );
  } catch (error) {
    console.error('Categories page error:', error);
    return <div>Error loading categories</div>;
  }
}
