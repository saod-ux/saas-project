import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import ThumbCard from "@/components/ui/ThumbCard";
import Link from "next/link";

interface CategoryGridProps {
  items: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    _count: { products: number };
  }>;
  title: string;
  tenantSlug: string;
  tenantLogo?: string | null;
}

export default function CategoryGrid({ items, title, tenantSlug, tenantLogo }: CategoryGridProps) {
  if (!items?.length) return null; // no empty white block

  return (
    <Section>
      <Container>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((c) => (
            <Link key={c.id} href={`/${tenantSlug}/categories/${c.slug}`} className="block">
              <article className="rounded-2xl border overflow-hidden bg-white">
                <ThumbCard
                  src={c.imageUrl}
                  alt={c.name}
                  fallbackSrc={tenantLogo}
                  aspectRatio="4/3"
                  className="bg-neutral-100"
                />
                <div className="p-2.5 text-sm">
                  <h3 className="font-medium">{c.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {c._count.products} {c._count.products === 1 ? "item" : "items"}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}


