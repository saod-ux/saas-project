import Image from "next/image";
import Container from "@/components/layout/Container";

interface HeroProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  showCta?: boolean;
  imageUrl?: string | null;
}

export default function Hero({ 
  title, 
  subtitle, 
  ctaText, 
  ctaHref, 
  showCta = true,
  imageUrl
}: HeroProps) {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white">
      {imageUrl && (
        <div className="absolute inset-0">
          <Image
            key={imageUrl}                // <-- forces re-render when URL changes
            src={imageUrl}
            alt={title}
            fill
            className="object-cover opacity-30"
            priority
          />
        </div>
      )}
      <Container>
        <div className="relative py-10 md:py-14 lg:py-16 text-center">
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
