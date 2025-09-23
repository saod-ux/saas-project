"use client";

import Link from "next/link";
import { formatKWD } from "@/lib/i18n";
import { useLanguage } from "@/contexts/LanguageContext";

interface Product {
  id: string;
  title: string;
  price: number;
}

interface SearchClientProps {
  query: string;
  results: Product[];
  tenantSlug: string;
}

export default function SearchClient({ query, results, tenantSlug }: SearchClientProps) {
  const { t, lang } = useLanguage();

  return (
    <main className="p-4 pb-20">
      <form>
        <input 
          name="q" 
          defaultValue={query} 
          placeholder={t("searchPlaceholder")} 
          className={`w-full border rounded px-3 py-2 ${lang === "ar" ? "text-right" : "text-left"}`} 
        />
      </form>

      <div className={`mt-3 text-sm text-neutral-700 ${lang === "ar" ? "text-end" : "text-start"}`}>
        {query ? `${t("resultsFor")} "${query}": ${results.length} ${t("results")}` : ""}
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {results.map(r => (
          <Link key={r.id} href={`/${tenantSlug}/product/${r.id}`} className="rounded-xl overflow-hidden border">
            <div className="aspect-[4/5] bg-neutral-100" />
            <div className="p-2">
              <h3 className={`text-sm font-semibold line-clamp-1 ${lang === "ar" ? "text-end" : "text-start"}`}>
                {r.title}
              </h3>
              <span className={`text-sm font-medium ${lang === "ar" ? "text-end" : "text-start"}`}>
                {formatKWD(Number(r.price))}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}


