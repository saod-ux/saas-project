import { getTenantBySlug } from "@/lib/firebase/tenant";
import { getTenantDocuments, COLLECTIONS } from "@/lib/firebase/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContentPage({ 
  params 
}: {
  params: { tenantSlug: string; slug: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) notFound();

  // Fetch the page
  const pages = await getTenantDocuments(COLLECTIONS.PAGES, tenant.id);
  const page = pages.find((p: any) => 
    p.slug === params.slug && p.isPublished === true
  );

  if (!page) notFound();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content || "" }}
          />
        </div>
      </div>
    </div>
  );
}
