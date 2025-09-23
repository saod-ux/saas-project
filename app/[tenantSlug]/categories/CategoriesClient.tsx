"use client";

import Link from "next/link";
import ThumbCard from "@/components/ui/ThumbCard";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";

interface Category {
  slug: string;
  name: string;
  imageUrl?: string | null;
  _count: { products: number };
}

interface CategoriesClientProps {
  categories: Category[];
  tenantSlug: string;
  tenantLogo?: string | null;
}

export default function CategoriesClient({ categories, tenantSlug, tenantLogo }: CategoriesClientProps) {
  return (
    <Section>
      <Container>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map(c => (
            <Link key={c.slug} href={`/${tenantSlug}/categories/${c.slug}`} className="block">
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


