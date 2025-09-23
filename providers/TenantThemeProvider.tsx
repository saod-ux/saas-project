'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface TenantTheme {
  primary: string
  accent: string
  bg: string
  card: string
  text: string
  logoUrl?: string
  // Hero controls
  showHero?: boolean
  heroTitle?: string
  heroSubtitle?: string
  heroCtaLabel?: string
  heroCtaHref?: string
  heroImageUrl?: string
  // Direction
  direction?: 'ltr' | 'rtl'
  locale?: 'en-US' | 'ar-KW'
}

interface TenantThemeContextType {
  theme: TenantTheme
  setTheme: (theme: Partial<TenantTheme>) => void
  loading: boolean
}

const defaultTheme: TenantTheme = {
  primary: '#1F2937',
  accent: '#111827',
  bg: '#FAF7F2',
  card: '#FFFFFF',
  text: '#1F2937',
  showHero: true,
          heroTitle: '',
          heroSubtitle: '',
          heroCtaLabel: '',
  heroCtaHref: '#products',
  direction: 'ltr',
  locale: 'en-US',
}

const TenantThemeContext = createContext<TenantThemeContextType | undefined>(undefined)

export function TenantThemeProvider({ 
  children, 
  initialTheme,
  tenantSlug
}: { 
  children: ReactNode
  initialTheme?: Partial<TenantTheme>
  tenantSlug?: string
}) {
  const [theme, setThemeState] = useState<TenantTheme>({
    ...defaultTheme,
    ...initialTheme,
  })
  const [loading, setLoading] = useState(true)

  const setTheme = (newTheme: Partial<TenantTheme>) => {
    setThemeState(prev => ({ ...prev, ...newTheme }))
  }

  // Load theme from settings
  useEffect(() => {
    async function loadTheme() {
      if (!tenantSlug) {
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch('/api/v1/settings', {
          headers: {
            'x-tenant-slug': tenantSlug
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const settings = data.data
          
          // Extract theme from settings
          const themeFromSettings: TenantTheme = {
            primary: settings.storefront?.theme?.primary || defaultTheme.primary,
            accent: settings.storefront?.theme?.accent || defaultTheme.accent,
            bg: settings.storefront?.theme?.bg || defaultTheme.bg,
            card: settings.storefront?.theme?.card || defaultTheme.card,
            text: settings.storefront?.theme?.text || defaultTheme.text,
            logoUrl: settings.storefront?.theme?.logoUrl,
            showHero: settings.storefront?.hero?.showHero ?? defaultTheme.showHero,
            heroTitle: settings.storefront?.hero?.heroTitle || defaultTheme.heroTitle,
            heroSubtitle: settings.storefront?.hero?.heroSubtitle || defaultTheme.heroSubtitle,
            heroCtaLabel: settings.storefront?.hero?.heroCtaLabel || defaultTheme.heroCtaLabel,
            heroCtaHref: settings.storefront?.hero?.heroCtaHref || defaultTheme.heroCtaHref,
            heroImageUrl: settings.storefront?.hero?.heroImageUrl,
            direction: settings.storefront?.localization?.direction || defaultTheme.direction,
            locale: settings.storefront?.localization?.locale || defaultTheme.locale,
          }
          
          setThemeState(themeFromSettings)
        }
      } catch (error) {
        console.error('Failed to load theme:', error)
        // Keep default theme on error
      } finally {
        setLoading(false)
      }
    }
    
    loadTheme()
  }, [tenantSlug])

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement
    
    // Set CSS variables
    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-accent', theme.accent)
    root.style.setProperty('--color-bg', theme.bg)
    root.style.setProperty('--color-card', theme.card)
    root.style.setProperty('--color-text', theme.text)
    
    // Set direction
    document.documentElement.dir = theme.direction || 'ltr'
    document.documentElement.lang = theme.locale === 'ar-KW' ? 'ar' : 'en'
    
    // Set font family based on locale
    if (theme.locale === 'ar-KW') {
      document.body.style.fontFamily = 'Cairo, sans-serif'
    } else {
      document.body.style.fontFamily = 'Inter, sans-serif'
    }
  }, [theme])

  return (
    <TenantThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </TenantThemeContext.Provider>
  )
}

export function useTenantTheme() {
  const context = useContext(TenantThemeContext)
  if (context === undefined) {
    throw new Error('useTenantTheme must be used within a TenantThemeProvider')
  }
  return context
}
