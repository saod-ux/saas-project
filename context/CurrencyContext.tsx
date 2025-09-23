'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface CurrencyContextType {
  selectedCurrency: string
  setSelectedCurrency: (currency: string) => void
  locale: 'ar-KW' | 'en-US'
  setLocale: (locale: 'ar-KW' | 'en-US') => void
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('KWD')
  const [locale, setLocale] = useState<'ar-KW' | 'en-US'>('en-US')

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency,
        setSelectedCurrency,
        locale,
        setLocale,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
