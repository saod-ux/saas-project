'use client';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  
  if (pages <= 1) return null;
  
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        className="rounded-xl border px-3 py-2 text-sm disabled:opacity-40"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        {page} / {pages}
      </span>
      <button
        className="rounded-xl border px-3 py-2 text-sm disabled:opacity-40"
        disabled={page === pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}










