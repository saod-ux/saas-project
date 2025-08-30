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
}

const defaultTheme: TenantTheme = {
  primary: '#1F2937',
  accent: '#111827',
  bg: '#FAF7F2',
  card: '#FFFFFF',
  text: '#1F2937',
  showHero: true,
  heroTitle: 'Welcome to Our Store',
  heroSubtitle: 'Discover amazing products at great prices',
  heroCtaLabel: 'Shop Now',
  heroCtaHref: '#products',
  direction: 'ltr',
  locale: 'en-US',
}

const TenantThemeContext = createContext<TenantThemeContextType | undefined>(undefined)

export function TenantThemeProvider({ 
  children, 
  initialTheme 
}: { 
  children: ReactNode
  initialTheme?: Partial<TenantTheme>
}) {
  const [theme, setThemeState] = useState<TenantTheme>({
    ...defaultTheme,
    ...initialTheme,
  })

  const setTheme = (newTheme: Partial<TenantTheme>) => {
    setThemeState(prev => ({ ...prev, ...newTheme }))
  }

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
    <TenantThemeContext.Provider value={{ theme, setTheme }}>
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
