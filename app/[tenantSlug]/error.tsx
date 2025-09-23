"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { tenantSlug } = useParams() as { tenantSlug: string };

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Storefront error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="h-16 w-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="h-8 w-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        {/* Error Content */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Something went wrong!</h1>
          <p className="text-gray-600 mb-4">
            We encountered an unexpected error. Please try again.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-100 p-4 rounded-lg text-sm">
              <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
              <pre className="whitespace-pre-wrap text-red-600">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
            <Link 
              href={`/${tenantSlug}`}
              className="inline-block bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back to Store
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            <Link 
              href={`/${tenantSlug}/retail`}
              className="hover:text-gray-700 underline"
            >
              Browse Products
            </Link>
            {" • "}
            <Link 
              href={`/${tenantSlug}/categories`}
              className="hover:text-gray-700 underline"
            >
              Categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


