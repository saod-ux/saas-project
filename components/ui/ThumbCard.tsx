import Image from "next/image";

interface ThumbCardProps {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string | null;
  className?: string;
  aspectRatio?: "square" | "4/3" | "16/9";
}

export default function ThumbCard({ 
  src, 
  alt, 
  fallbackSrc, 
  className = "",
  aspectRatio = "square"
}: ThumbCardProps) {
  const aspectClasses = {
    square: "aspect-square",
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-[16/9]"
  };

  const displaySrc = src || fallbackSrc || "/placeholder.svg";
  const isUsingFallback = !src && fallbackSrc;

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${aspectClasses[aspectRatio]} ${className}`}>
      <Image
        src={displaySrc}
        alt={alt}
        fill
        className={`object-cover ${isUsingFallback ? "opacity-60" : ""}`}
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
      />
    </div>
  );
}


