"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Globe } from "lucide-react";

export default function SimpleNavbar({
  tenantSlug,
  tenantName,
  logoUrl,
}: {
  tenantSlug: string;
  tenantName: string;
  logoUrl?: string | null;
}) {
  return (
    <header
      className="sticky top-0 z-50 bg-black text-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      aria-label="Top navigation"
    >
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Logo + Name */}
        <Link href={`/${tenantSlug}/retail`} className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-lg bg-white/90 flex items-center justify-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={tenantName}
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <span className="text-black font-bold">{tenantName?.[0] ?? "S"}</span>
            )}
          </div>
          <span className="font-semibold">{tenantName}</span>
        </Link>

        {/* Right: Search, Cart, Language */}
        <div className="flex items-center gap-1">
          <Link
            href={`/${tenantSlug}/search`}
            aria-label="Search"
            className="rounded-full p-2 hover:bg-white/10"
          >
            <Search className="h-5 w-5" />
          </Link>

          <Link
            href={`/${tenantSlug}/cart`}
            aria-label="Cart"
            className="relative rounded-full p-2 hover:bg-white/10"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>

          <button
            aria-label="Language"
            className="rounded-full p-2 hover:bg-white/10"
          >
            <Globe className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}