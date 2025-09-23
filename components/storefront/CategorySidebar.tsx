"use client";

import clsx from "clsx";

type Category = { id: string; name: string; slug: string; count?: number };

export default function CategorySidebar({
  categories,
  activeSlug,
  onSelect,
}: {
  categories: Category[];
  activeSlug?: string;
  onSelect: (slug?: string) => void;
}) {
  return (
    <aside className="sticky top-24 w-[240px] shrink-0 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm max-h-[70vh] overflow-y-auto">
      <h4 className="mb-3 text-sm font-semibold text-gray-900">Categories</h4>
      <ul className="space-y-2">
        <li>
          <button
            onClick={() => onSelect(undefined)}
            className={clsx(
              "w-full text-left rounded-xl px-3 py-2 text-sm transition",
              activeSlug
                ? "text-gray-600 hover:bg-gray-50"
                : "bg-blue-50 text-blue-700 font-medium"
            )}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(undefined);
              }
            }}
          >
            All Products
          </button>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelect(c.slug)}
              className={clsx(
                "w-full text-left rounded-xl px-3 py-2 text-sm transition",
                activeSlug === c.slug
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(c.slug);
                }
              }}
            >
              {c.name}
              {typeof c.count === "number" && (
                <span className="ml-2 text-xs text-gray-400">({c.count})</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
