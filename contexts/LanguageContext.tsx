"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslations } from '@/lib/i18n';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  isArabic: boolean;
  // Additional properties for compatibility
  lang: string;
  setLang: (lang: string) => void;
  language: string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState('ar'); // Default to Arabic
  
  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('admin-locale');
    if (savedLocale) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    localStorage.setItem('admin-locale', newLocale);
  };

  const t = getTranslations(locale);
  const isArabic = locale.startsWith('ar');
  const isRTL = isArabic;

  return (
    <LanguageContext.Provider value={{ 
      locale, 
      setLocale, 
      t, 
      isArabic,
      lang: locale,
      setLang: setLocale,
      language: locale,
      isRTL
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}