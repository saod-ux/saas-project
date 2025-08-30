'use client'

import { Button } from '@/components/ui/button'
import { useTenantTheme } from '@/providers/TenantThemeProvider'

interface HeroSectionProps {
  showHero: boolean
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  imageUrl?: string
}

export default function HeroSection({
  showHero,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  imageUrl
}: HeroSectionProps) {
  const { theme } = useTenantTheme()

  if (!showHero) {
    return null
  }

  const handleCtaClick = () => {
    if (ctaHref.startsWith('#')) {
      // Scroll to element
      const element = document.querySelector(ctaHref)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else if (ctaHref.startsWith('/')) {
      // Internal navigation
      window.location.href = ctaHref
    } else {
      // External link
      window.open(ctaHref, '_blank')
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      {imageUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: theme.primary + '80' }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ color: imageUrl ? '#FFFFFF' : theme.text }}
          >
            {title}
          </h1>
          
          <p 
            className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed"
            style={{ color: imageUrl ? '#FFFFFF' + 'CC' : theme.text + 'CC' }}
          >
            {subtitle}
          </p>
          
          <Button
            size="lg"
            onClick={handleCtaClick}
            className="text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{ 
              backgroundColor: imageUrl ? theme.accent : theme.primary,
              color: '#FFFFFF'
            }}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      {!imageUrl && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full" style={{ backgroundColor: theme.primary }} />
          <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full" style={{ backgroundColor: theme.accent }} />
          <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full" style={{ backgroundColor: theme.primary }} />
        </div>
      )}
    </section>
  )
}
