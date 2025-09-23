'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getLanguageName, getLanguageFlag } from '@/lib/i18n-utils'

interface LocaleContextType {
  locale: string
  direction: 'ltr' | 'rtl'
  setLocale: (locale: string) => void
  t: (key: string, values?: Record<string, any>) => string
  languageName: string
  languageFlag: string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

// Cookie utilities
function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

function getCookie(name: string): string | null {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

export function LocaleProvider({ 
  children, 
  initialLocale = 'en',
  messages,
  enMessages,
  arMessages
}: { 
  children: React.ReactNode
  initialLocale?: string
  messages?: any
  enMessages?: any
  arMessages?: any
}) {
  const [locale, setLocaleState] = useState(initialLocale)
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(initialLocale === 'ar' ? 'rtl' : 'ltr')
  const router = useRouter()
  const pathname = usePathname()

  // Determine which messages to use
  const getCurrentMessages = () => {
    if (enMessages && arMessages) {
      // If we have both message sets, use the appropriate one
      return locale === 'ar' ? arMessages : enMessages
    }
    // Fallback to the single messages prop
    return messages
  }

  // Update document direction and language when locale changes
  useEffect(() => {
    const newDirection = locale === 'ar' ? 'rtl' : 'ltr'
    setDirection(newDirection)
    
    // Update document direction and language
    if (typeof document !== 'undefined') {
      document.documentElement.dir = newDirection
      document.documentElement.lang = locale
      
      // Update font family
      document.documentElement.style.fontFamily = locale === 'ar' 
        ? 'Cairo, system-ui, sans-serif' 
        : 'Inter, system-ui, sans-serif'
    }
    
    // Store in localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('locale', locale)
      localStorage.setItem('direction', newDirection)
    }
  }, [locale])

  // Load locale from cookie/localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Try cookie first, then localStorage
    const cookieLocale = getCookie('lang')
    const savedLocale = localStorage.getItem('locale')
    
    if (cookieLocale && (cookieLocale === 'en' || cookieLocale === 'ar')) {
      setLocaleState(cookieLocale)
    } else if (savedLocale && (savedLocale === 'en' || savedLocale === 'ar')) {
      setLocaleState(savedLocale)
    }
  }, [])

  const setLocale = (newLocale: string) => {
    if (newLocale === 'en' || newLocale === 'ar') {
      // Set cookie for 1 year
      setCookie('lang', newLocale, 365)
      
      // Update state
      setLocaleState(newLocale)
      
      // Reload the page to get fresh messages and content
      router.replace(pathname)
    }
  }

  // Translation function
  const t = (key: string, values?: Record<string, any>): string => {
    const currentMessages = getCurrentMessages()
    const keys = key.split('.')
    let value: any = currentMessages
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
      }
    }
    
    if (typeof value === 'string') {
      // Replace placeholders
      if (values) {
        return value.replace(/\{(\w+)\}/g, (match, key) => {
          return values[key]?.toString() || match
        })
      }
      return value
    }
    
    return key
  }

  const languageName = getLanguageName(locale)
  const languageFlag = getLanguageFlag(locale)

  return (
    <LocaleContext.Provider value={{ 
      locale, 
      direction, 
      setLocale, 
      t, 
      languageName, 
      languageFlag 
    }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
