"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PageHelp } from "@/components/admin/PageHelp";

type PageDoc = { id?: string; title: string; content: string; slug: string; isPublished: boolean };

const SLUGS = ["about", "contact", "faq", "privacy"];

export default function ContentPage() {
  const { tenantSlug } = useParams() as { tenantSlug: string };
  const searchParams = useSearchParams();
  const locale = searchParams.get('locale') || 'en';
  const [pages, setPages] = useState<Record<string, PageDoc>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/${tenantSlug}/pages`);
      const json = await res.json();
      const map: Record<string, PageDoc> = {};
      SLUGS.forEach((slug) => {
        const existing = json.data.find((p: any) => p.slug === slug);
        map[slug] = existing ?? { slug, title: slug.toUpperCase(), content: "", isPublished: true };
      });
      setPages(map);
    })();
  }, [tenantSlug]);

  async function save(slug: string) {
    const doc = pages[slug];
    await fetch(`/api/admin/${tenantSlug}/pages/${slug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(doc),
    });
  }

  return (
    <div className="p-6 space-y-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Content Pages</h1>
        <PageHelp pageKey="pages" locale={locale} />
      </div>
      {SLUGS.map((slug) => {
        const doc = pages[slug];
        if (!doc) return null;
        return (
          <div key={slug} className="rounded border bg-white p-4">
            <div className="mb-2 font-medium">{doc.title} ({slug})</div>
            <input
              className="w-full rounded border p-2 mb-2"
              placeholder="Title"
              value={doc.title}
              onChange={(e) => setPages((s) => ({ ...s, [slug]: { ...doc, title: e.target.value } }))}
            />
            <textarea
              className="w-full rounded border p-2 h-40"
              placeholder="Content (Markdown or HTML)"
              value={doc.content}
              onChange={(e) => setPages((s) => ({ ...s, [slug]: { ...doc, content: e.target.value } }))}
            />
            <div className="mt-3 flex items-center justify-between">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={doc.isPublished}
                  onChange={(e) => setPages((s) => ({ ...s, [slug]: { ...doc, isPublished: e.target.checked } }))}
                />
                <span>Published</span>
              </label>
              <button onClick={() => save(slug)} className="rounded bg-black text-white px-3 py-2">Save</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
