import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import ThumbCard from "@/components/ui/ThumbCard";
import Link from "next/link";
import { formatMoney } from "@/lib/formatPrice";

interface ProductGridProps {
  items: Array<{
    id: string;
    title: string;
    price: number;
    currency: string;
    imageUrl?: string | null;
    primaryImageUrl?: string | null;
  }>;
  title: string;
  tenantSlug: string;
  tenantLogo?: string | null;
}

export default function ProductGrid({ items, title, tenantSlug, tenantLogo }: ProductGridProps) {
  if (!items?.length) return null; // no empty white block

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
          <div className="w-24 h-1 bg-gray-300 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((product) => (
            <Link key={product.id} href={`/${tenantSlug}/product/${product.id}`} className="group">
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <ThumbCard
                    src={product.primaryImageUrl || product.imageUrl}
                    alt={product.title}
                    fallbackSrc={tenantLogo}
                    aspectRatio="square"
                    className="bg-gradient-to-br from-gray-100 to-gray-200 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-gray-900">
                      {formatMoney(product.price, product.currency, 'en-US')}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
