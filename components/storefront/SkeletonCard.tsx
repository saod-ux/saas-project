export default function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="aspect-[4/3] w-full animate-pulse bg-gray-100 rounded-t-2xl" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 rounded bg-gray-100" />
        <div className="h-3 w-5/6 rounded bg-gray-100" />
        <div className="h-5 w-1/3 rounded bg-gray-100" />
      </div>
    </div>
  );
}