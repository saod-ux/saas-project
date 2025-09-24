'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface MobileMenuProps {
  tenantSlug: string;
  categories: { name: string; slug: string }[];
}

export default function MobileMenu({ tenantSlug, categories }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  const menuItems = [
    { label: 'Home', href: `/${tenantSlug}/retail` },
    { label: 'Best Sellers', href: `/${tenantSlug}/retail?tag=best` },
    { label: 'New Arrivals', href: `/${tenantSlug}/retail?tag=new` },
    { label: 'Offers', href: `/${tenantSlug}/retail?tag=offer` },
    { label: 'About Us', href: `/${tenantSlug}/about` },
    { label: 'Contact Us', href: `/${tenantSlug}/contact` },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        
        <nav className="mt-6 space-y-4">
          {/* Shop Dropdown */}
          <Collapsible open={isShopOpen} onOpenChange={setIsShopOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left hover:text-blue-600 transition-colors">
              <span>Shop</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isShopOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-4 space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No categories available</p>
              ) : (
                categories.map(category => (
                  <a
                    key={category.slug}
                    href={`/${tenantSlug}/retail?cat=${category.slug}&page=1`}
                    className="block py-2 text-sm hover:text-blue-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {category.name}
                  </a>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Other Menu Items */}
          {menuItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="block py-2 hover:text-blue-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}












