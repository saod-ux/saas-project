'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface ShopDropdownProps {
  tenantSlug: string;
  categories: { name: string; slug: string }[];
}

export default function ShopDropdown({ tenantSlug, categories }: ShopDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors">
        Shop <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {categories.length === 0 ? (
          <DropdownMenuItem disabled>
            No categories available
          </DropdownMenuItem>
        ) : (
          categories.map(category => (
            <DropdownMenuItem key={category.slug} asChild>
              <a 
                href={`/${tenantSlug}/retail?cat=${category.slug}&page=1`}
                className="block w-full"
              >
                {category.name}
              </a>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}













