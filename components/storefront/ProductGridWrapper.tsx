"use client";

import { useState, useEffect } from 'react';
import ProductGrid from './ProductGrid';
import SkeletonCard from '@/components/ui/SkeletonCard';

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stockQty: number;
  categoryName?: string;
  imageUrl?: string;
  status?: string;
};

export default function ProductGridWrapper({
  products,
}: {
  products: Product[];
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [products]);

  const handleAdd = (id: string) => {
    // Handle add to cart functionality
    console.log('Add to cart:', id);
    // TODO: Implement actual cart functionality
  };

  if (isLoading) {
    return (
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return <ProductGrid products={products} onAdd={handleAdd} />;
}
