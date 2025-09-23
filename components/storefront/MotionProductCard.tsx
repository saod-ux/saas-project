"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Tag } from "lucide-react";
import { formatMoney } from "@/lib/formatPrice";
import ThumbCard from "@/components/ui/ThumbCard";

type Props = {
  id: string;
  title: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  stock?: number;
  imageUrl?: string | null;
  categoryName?: string;
  onAdd?: (id: string) => void;
  tenantLogoUrl?: string | null;
  currency?: string;
  locale?: string;
};

export default function MotionProductCard({
  id,
  title,
  description,
  price,
  compareAtPrice,
  stock,
  imageUrl,
  categoryName,
  onAdd,
  tenantLogoUrl,
  currency = 'KWD',
  locale = 'en-US',
}: Props) {
  const hasDiscount =
    compareAtPrice && Number(compareAtPrice) > Number(price);

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="group rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-lg hover:ring-1 hover:ring-blue-100"
    >
      {/* image */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <ThumbCard
          src={imageUrl}
          alt={title}
          fallbackSrc={tenantLogoUrl}
          aspectRatio="4/3"
        />

        {hasDiscount && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-600/90 px-2.5 py-1 text-xs font-semibold text-white">
            <Tag className="h-3.5 w-3.5" />
            {Math.round(
              (1 - Number(price) / Number(compareAtPrice)) * 100
            )}
            % off
          </div>
        )}
      </div>

      {/* content */}
      <div className="p-4">
        {categoryName && (
          <span className="mb-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {categoryName}
          </span>
        )}

        <h3 className="mt-3 text-sm font-semibold text-gray-900 line-clamp-2">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {description}
          </p>
        )}

        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatMoney(price, currency, locale)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatMoney(compareAtPrice, currency, locale)}
              </span>
            )}
          </div>

          <button
            onClick={() => onAdd?.(id)}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 active:scale-[.98] transition"
            aria-label={`Add ${title} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </button>
        </div>

        {typeof stock === "number" && (
          <p className="mt-2 text-xs text-gray-500">{stock} in stock</p>
        )}
      </div>
    </motion.div>
  );
}
