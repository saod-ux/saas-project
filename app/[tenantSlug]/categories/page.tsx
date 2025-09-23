import { prismaRW } from "@/lib/db";
import CategoriesClient from "./CategoriesClient";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import EmptyCompact from "@/components/ui/EmptyCompact";

export const revalidate = 0;

export default async function CategoriesPage({ params }:{ params: Promise<{tenantSlug:string}> }) {
  const { tenantSlug } = await params;
  
  try {
    const tenant = await prismaRW.tenant.findUnique({ 
      where:{ slug: tenantSlug }, 
      select:{ 
        id: true, 
        name: true,
        logoUrl: true,
        settingsJson: true,
      }
    });
    
    if (!tenant) return <div>Tenant not found</div>;

    // Simple translation function
    const t = (key: string) => {
      const translations: Record<string, string> = {
        'categories.title': 'Browse by Category',
      };
      return translations[key] || key;
    };

    const cats = await prismaRW.category.findMany({
      where:{ tenantId: tenant.id, isActive: true },
      orderBy:[{ sortOrder:"asc" }, { name:"asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        _count: { select: { products: true } }
      }
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
        {cats.length > 0 ? (
          <CategoriesClient categories={cats} tenantSlug={tenantSlug} tenantLogo={tenant.logoUrl} />
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
