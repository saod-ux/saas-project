"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Container from "@/components/layout/Container";

interface HeroSlide {
  url: string;
  alt: string;
}

interface HeroCarouselProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  showCta?: boolean;
  slides: HeroSlide[];
}

export default function HeroCarousel({ 
  title, 
  subtitle, 
  ctaText, 
  ctaHref, 
  showCta = true,
  slides = []
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4500);
    
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [slides.length]);

  // If no slides, show gradient background
  if (slides.length === 0) {
    return (
      <div className="relative bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white">
        <Container>
          <div className="py-10 md:py-14 lg:py-16 text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">{title}</h1>
            {subtitle && <p className="mt-2 md:mt-3 text-sm md:text-base opacity-90">{subtitle}</p>}
            {showCta && ctaText && ctaHref && (
              <div className="mt-5">
                <a
                  href={ctaHref}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {ctaText}
                </a>
              </div>
            )}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="relative bg-neutral-100">
      <div className="relative overflow-hidden">
        {/* aspect ratio: taller on mobile, slimmer on desktop */}
        <div className="relative aspect-[16/9] md:aspect-[16/6]">
          <Image
            key={slides[index].url}
            src={slides[index].url}
            alt={slides[index].alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* subtle gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-transparent" />
          
          {/* text/CTA */}
          <Container>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-3">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold drop-shadow-sm">{title}</h1>
              {subtitle && <p className="mt-2 md:mt-3 text-sm md:text-base opacity-95 drop-shadow-sm">{subtitle}</p>}
              {showCta && ctaText && ctaHref && (
                <a
                  href={ctaHref}
                  className="mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {ctaText}
                </a>
              )}
            </div>
          </Container>
        </div>
      </div>
      
      {/* tiny dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === index ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


