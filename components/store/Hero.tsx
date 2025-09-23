"use client";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeroProps {
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
}

export default function Hero({ 
  title,
  subtitle,
  imageUrl,
  videoUrl
}: HeroProps) {
  const { isRTL } = useLanguage();

  return (
    <section className="relative w-full h-64 md:h-80 overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        {videoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Hero background"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
        )}
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Centered content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-white/90 drop-shadow-lg">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}