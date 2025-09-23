"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, MoreHorizontal } from "lucide-react";
import { useState } from "react";

export default function SimpleBottomTabs({ tenantSlug }: { tenantSlug: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isHome = pathname?.startsWith(`/${tenantSlug}/retail`) ?? false;
  const isCart = pathname?.startsWith(`/${tenantSlug}/cart`) ?? false;

  const base = "flex-1 flex flex-col items-center justify-center gap-1 py-2 select-none";
  const iconWrap = "flex h-8 w-8 items-center justify-center rounded-full border";
  const activeIcon = "bg-black text-white border-black";
  const inactiveIcon = "bg-white text-black border-neutral-300";
  const labelActive = "text-sm font-semibold";
  const label = "text-sm text-neutral-600";

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Bottom navigation"
      >
        <div className="mx-auto grid max-w-screen-sm grid-cols-3">
          <Link href={`/${tenantSlug}/retail`} className={base} aria-label="Home">
            <div className={`${iconWrap} ${isHome ? activeIcon : inactiveIcon}`}>
              <Home className="h-5 w-5" />
            </div>
            <span className={isHome ? labelActive : label}>Home</span>
          </Link>

          <Link href={`/${tenantSlug}/cart`} className={base} aria-label="Cart">
            <div className={`${iconWrap} ${isCart ? activeIcon : inactiveIcon}`}>
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className={isCart ? labelActive : label}>Cart</span>
          </Link>

          <button
            type="button"
            className={base}
            aria-label="More"
            onClick={() => setOpen(true)}
          >
            <div className={`${iconWrap} ${!isHome && !isCart ? activeIcon : inactiveIcon}`}>
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className={!isHome && !isCart ? labelActive : label}>More</span>
          </button>
        </div>
      </nav>

      {/* Simple More Sheet */}
      {open && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">More</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <Link
                href={`/${tenantSlug}/contact`}
                className="rounded-xl border bg-white px-4 py-3 text-center hover:shadow-sm"
                onClick={() => setOpen(false)}
              >
                Contact
              </Link>
              <Link
                href={`/${tenantSlug}/about`}
                className="rounded-xl border bg-white px-4 py-3 text-center hover:shadow-sm"
                onClick={() => setOpen(false)}
              >
                About
              </Link>
              <Link
                href={`/${tenantSlug}/faq`}
                className="rounded-xl border bg-white px-4 py-3 text-center hover:shadow-sm"
                onClick={() => setOpen(false)}
              >
                FAQ
              </Link>
            </div>
            <div className="text-center text-xs text-neutral-500">
              Powered by E-view
            </div>
          </div>
        </>
      )}
    </>
  );
}