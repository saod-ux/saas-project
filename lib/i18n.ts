import enMessages from '@/messages/en.json';
import arMessages from '@/messages/ar.json';

type Messages = typeof enMessages;

// Language types and constants
export type Language = 'ar' | 'en';
export const DEFAULT_LANGUAGE: Language = 'en';

// Global language state
let currentLanguage: Language = DEFAULT_LANGUAGE;

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function setCurrentLanguage(language: Language): void {
  currentLanguage = language;
}

export function getTranslations(locale: string, namespace?: string) {
  const messages = locale.startsWith('ar') ? arMessages : enMessages;
  
  return function t(key: string | null | undefined): string {
    if (!key || typeof key !== 'string') {
      return key || '';
    }
    
    const keys = key.split('.');
    let value: any = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };
}

export function getLocaleFromTenant(tenant: any): string {
  return tenant?.settings?.localization?.locale || 'en-US';
}

export function isArabic(locale: string): boolean {
  return locale.startsWith('ar');
}

export function formatKWD(amount: number): string {
  return new Intl.NumberFormat('en-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
}