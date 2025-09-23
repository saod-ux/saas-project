"use client";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import Hero from "@/components/store/Hero";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
}

interface Tenant {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
}

interface RetailPageClientProps {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  catSlug: string | null;
  tenantSlug: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="px-4 pt-4 text-lg font-semibold">{children}</h2>;
}

export default function RetailPageClient({
  tenant,
  categories,
  products,
  catSlug,
  tenantSlug,
}: RetailPageClientProps) {
  const { t, isRTL } = useLanguage();

  return (
    <div>
      <Hero
        title={t("watchStoryTitle")}
        subtitle={t("watchStorySubtitle")}
        imageUrl={tenant.heroImageUrl ?? "/hero-fallback.jpg"}
        videoUrl={tenant.heroVideoUrl ?? undefined}
      />

      <SectionTitle>{t("shopByCategory")}</SectionTitle>

      {/* Category grid */}
      <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/${tenant.slug}/retail?cat=${encodeURIComponent(c.slug)}&page=1`}
            className="group rounded-xl border bg-white p-3 hover:shadow-sm transition"
          >
            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300" />
            <div className="mt-2 font-medium">{c.name}</div>
          </Link>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full text-neutral-500">{t("emptyState")}</div>
        )}
      </div>

      {/* Products grid when a category is chosen */}
      {catSlug && (
        <>
          <SectionTitle>Products</SectionTitle>
          <div className="px-4 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/${tenant.slug}/product/${p.id}`}
                className="rounded-xl border bg-white hover:shadow-sm transition"
              >
                <div className="aspect-square overflow-hidden rounded-t-xl bg-neutral-200" />
                <div className="p-3">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-neutral-600">{String(p.price)} {t("priceCurrency")}</div>
                  <div className="text-xs text-neutral-500 mt-1">{t("prepTime")}</div>
                  <div className="mt-2 flex gap-2">
                    <button className="flex-1 rounded-lg border px-3 py-1.5 text-sm">{t("add")}</button>
                    <button className="flex-1 rounded-lg bg-black px-3 py-1.5 text-sm text-white">{t("buyNow")}</button>
                  </div>
                </div>
              </Link>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-neutral-500">{t("emptyState")}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}


