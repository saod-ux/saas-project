"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Empty } from "@/components/ui/Empty";

// Client component; do not export dynamic/revalidate here (server-only)

// Mock search results for demonstration
const mockSearchResults = [
  {
    id: "1",
    title: "Classic Burger",
    price: 3.5,
  },
  {
    id: "2",
    title: "Cheese Burger",
    price: 4.0,
  },
  {
    id: "3",
    title: "Margherita Pizza",
    price: 8.5,
  },
  {
    id: "4",
    title: "Fresh Orange Juice",
    price: 2.5,
  },
];

function SearchPageContent({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      // Mock search - filter results based on query
      const filtered = mockSearchResults.filter(product => 
        product.title.toLowerCase().includes(q.toLowerCase())
      );
      setResults(filtered);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const filtered = mockSearchResults.filter(product => 
        product.title.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("search")}
          </h1>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="px-6">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Search Results */}
        {query && (
          <div>
            <p className="text-gray-600 mb-4">
              {results.length} results for "{query}"
            </p>
            
            {results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/${params.tenantSlug}/product/${product.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">{t("emptyState")}</span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {product.title}
                      </h3>
                      <div className="text-sm text-gray-600">
                        {product.price} {t("priceCurrency")}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {t("prepTime")}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button className="flex-1 rounded-lg border px-3 py-1.5 text-sm">
                          {t("add")}
                        </button>
                        <button className="flex-1 rounded-lg bg-black px-3 py-1.5 text-sm text-white">
                          {t("buyNow")}
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty
                icon={<div className="text-4xl">🔍</div>}
                title="No results found"
                description={`No products found for "${query}"`}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom spacing for navigation */}
      <div className="h-20" />
    </div>
  );
}

export default function SearchPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <SearchPageContent params={params} />
    </Suspense>
  );
}