'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart';

interface CartButtonProps {
  tenantSlug: string;
}

export default function CartButton({ tenantSlug }: CartButtonProps) {
  const totalItems = useCartStore(state => state.totalItems);

  return (
    <a 
      href={`/${tenantSlug}/cart`} 
      className="relative rounded-full p-2 hover:bg-gray-100 transition-colors"
      aria-label={`Shopping cart with ${totalItems} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 rounded-full bg-blue-600 px-1.5 text-xs font-medium text-white min-w-[1.25rem] h-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </a>
  );
}










