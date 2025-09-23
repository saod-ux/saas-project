"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface HeroMediaItem {
  url: string;
  type: "image" | "video";
  poster?: string;
}

interface HeroMediaProps {
  items: HeroMediaItem[];
}

export default function HeroMedia({ items }: HeroMediaProps) {
  const [index, setIndex] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance for carousel (only if there are 2+ active items)
  useEffect(() => {
    if (items.length <= 1) return;
    
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 4500);
    
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [items.length]);

  // If no items, show gradient background
  if (items.length === 0) {
    return (
      <div className="relative bg-gradient-to-r from-indigo-600 to-fuchsia-600">
        <div className="relative aspect-[16/9] md:aspect-[16/6]">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-fuchsia-600" />
        </div>
      </div>
    );
  }

  // Single item - no carousel
  if (items.length === 1) {
    const item = items[0];
    
    return (
      <div className="relative bg-neutral-100">
        <div className="relative aspect-[16/9] md:aspect-[16/6]">
          {item.type === 'image' ? (
            <Image
              src={item.url}
              alt="Hero image"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <video
              src={item.url}
              poster={item.poster}
              playsInline
              muted
              autoPlay
              loop
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    );
  }

  // Multiple items - carousel
  return (
    <div className="relative bg-neutral-100">
      <div className="relative overflow-hidden">
        <div className="relative aspect-[16/9] md:aspect-[16/6]">
          {items[index].type === 'image' ? (
            <Image
              key={items[index].url}
              src={items[index].url}
              alt="Hero image"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <video
              key={items[index].url}
              src={items[index].url}
              poster={items[index].poster}
              playsInline
              muted
              autoPlay
              loop
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
      
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === index ? "bg-white" : "bg-white/50"
            }`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
