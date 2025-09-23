"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface HeaderSearchProps {
  tenantSlug: string;
}

export default function HeaderSearch({ tenantSlug }: HeaderSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/${tenantSlug}/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-3 rounded-full hover:bg-gray-100 transition-colors group"
        aria-label="Search"
      >
        <Search className="h-5 w-5 text-gray-600 group-hover:text-gray-900 group-hover:scale-110 transition-all" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[90%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <form onSubmit={onSubmit} className="flex items-center gap-3 px-4 py-3">
                <Search className="h-5 w-5 text-gray-500" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن المنتجات / Search products"
                  className="w-full outline-none text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
                >
                  بحث / Search
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


