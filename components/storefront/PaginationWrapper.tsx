'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function PaginationWrapper({ 
  totalPages, 
  currentPage 
}: { 
  totalPages: number; 
  currentPage: number; 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = (p: number) => {
    const clamped = Math.min(totalPages, Math.max(1, p));
    const sp = new URLSearchParams(params);
    sp.set('page', String(clamped));
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      <button 
        onClick={() => go(currentPage - 1)} 
        disabled={currentPage <= 1} 
        className="rounded-xl border px-3 py-1.5 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {currentPage} / {totalPages}
      </span>
      <button 
        onClick={() => go(currentPage + 1)} 
        disabled={currentPage >= totalPages} 
        className="rounded-xl border px-3 py-1.5 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
