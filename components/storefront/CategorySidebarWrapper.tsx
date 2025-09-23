'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function CategorySidebarWrapper({
  categories,
  activeSlug,
  activeTag,
  showAllOption = false,
}: {
  categories: { id: string; name: string; slug: string; count: number }[];
  activeSlug: string | null;
  activeTag?: string | null;
  showAllOption?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setCat = (slug: string | null) => {
    const sp = new URLSearchParams(params);
    if (slug) {
      sp.set('cat', slug);
      sp.delete('tag'); // Clear tag when selecting category
      sp.set('page', '1');
    } else {
      sp.delete('cat');
      sp.delete('tag');
      sp.delete('page');
    }
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <ul className="space-y-1">
      {showAllOption && (
        <li>
          <button
            onClick={() => setCat(null)}
            className={`w-full text-left rounded-xl px-3 py-2 transition ${
              !activeSlug && !activeTag ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
        </li>
      )}
      {categories.map(c => (
        <li key={c.id}>
          <button
            onClick={() => setCat(c.slug)}
            className={`w-full text-left rounded-xl px-3 py-2 transition flex items-center justify-between ${
              activeSlug === c.slug && !activeTag ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
            }`}
          >
            <span className="truncate">{c.name}</span>
            <span className="ml-3 text-xs text-gray-500">({c.count})</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
