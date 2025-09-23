export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-gray-200" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        
        {/* Price and button skeleton */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}


