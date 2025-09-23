import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getTenantDocuments } from "@/lib/db";
import Link from "next/link";
import { t, formatKWD } from "@/lib/arabic";

export const revalidate = 0;

export default async function CategoryDetail({ params }:{ params:{ tenantSlug:string; slug:string } }) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) return null;

  const categories = await getTenantDocuments('categories', tenant.id);
  const category = categories.find((cat: any) => cat.slug === params.slug);
  if (!category) return <main className="p-4">القسم غير موجود</main>;

  // For now, return empty products array since products are not fully implemented in Firebase
  const products: any[] = [];

  return (
    <main className="pb-20">
      <section className="px-3 py-2">
        <div className="flex items-center justify-between bg-neutral-100 rounded-xl px-3 py-2">
          <h1 className="font-semibold">{category.name}</h1>
          <Link href={`/${params.tenantSlug}/retail`} className="text-sm">العودة للرئيسية ←</Link>
        </div>
      </section>

      <section className="px-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {products.map(p=>(
          <article key={p.id} className="rounded-xl overflow-hidden border">
            <Link href={`/${params.tenantSlug}/product/${p.id}`}>
              <div className="aspect-[4/5] bg-neutral-100" />
            </Link>
            <div className="p-2">
              <h3 className="text-sm font-semibold line-clamp-1">{p.title}</h3>
              <div className="text-sm mt-1">
                {p.compareAtPrice && <span className="line-through text-neutral-500 ms-2">{formatKWD(Number(p.compareAtPrice))}</span>}
                <span className="font-medium">{formatKWD(Number(p.price))}</span>
              </div>
              <p className="text-xs text-neutral-600 mt-1">{t.prepTime}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button className="h-9 rounded-lg border">{t.add}</button>
                <button className="h-9 rounded-lg bg-black text-white">{t.buyNow}</button>
              </div>
            </div>
          </article>
        ))}
        {products.length === 0 && <div className="col-span-full p-6 text-center text-sm text-neutral-500">{t.noProducts}</div>}
      </section>
    </main>
  );
}
