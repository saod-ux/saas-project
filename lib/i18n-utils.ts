/**
 * i18n utility functions for the multi-tenant SaaS platform
 */

export interface I18nContent {
  ar: string
  en: string
}

export interface I18nContentOptional {
  ar?: string
  en?: string
}

/**
 * Pick the appropriate localized content based on locale
 * @param content - Object with ar/en keys or string
 * @param locale - Current locale ('ar' | 'en')
 * @param fallback - Fallback locale if primary is empty
 * @returns Localized string or fallback
 */
export function pickI18n(
  content: I18nContent | I18nContentOptional | string | null | undefined,
  locale: string,
  fallback: string = 'en'
): string {
  if (!content) return ''
  
  // If it's already a string, return it (for backward compatibility)
  if (typeof content === 'string') return content
  
  // If it's an object with ar/en keys
  if (typeof content === 'object' && content !== null) {
    const primary = content[locale as keyof typeof content]
    const fallbackContent = content[fallback as keyof typeof content]
    
    // Return primary if it exists and is not empty
    if (primary && typeof primary === 'string' && primary.trim()) {
      return primary
    }
    
    // Return fallback if primary is empty
    if (fallbackContent && typeof fallbackContent === 'string' && fallbackContent.trim()) {
      return fallbackContent
    }
  }
  
  return ''
}

/**
 * Check if content has both languages
 */
export function hasBothLanguages(content: I18nContent | I18nContentOptional | string | null | undefined): boolean {
  if (!content || typeof content === 'string') return false
  
  const ar = content.ar || ''
  const en = content.en || ''
  
  return ar.trim().length > 0 && en.trim().length > 0
}

/**
 * Check if content is missing a specific language
 */
export function isMissingLanguage(
  content: I18nContent | I18nContentOptional | string | null | undefined,
  language: 'ar' | 'en'
): boolean {
  if (!content || typeof content === 'string') return true
  
  const langContent = content[language] || ''
  return !langContent.trim()
}

/**
 * Create i18n content object from existing string
 */
export function createI18nContent(
  existingContent: string | null | undefined,
  defaultLanguage: 'ar' | 'en' = 'en'
): I18nContent {
  return {
    ar: defaultLanguage === 'ar' ? (existingContent || '') : '',
    en: defaultLanguage === 'en' ? (existingContent || '') : ''
  }
}

/**
 * Copy content from one language to another
 */
export function copyLanguageContent(
  content: I18nContent | I18nContentOptional,
  fromLanguage: 'ar' | 'en',
  toLanguage: 'ar' | 'en'
): I18nContent {
  const fromContent = content[fromLanguage] || ''
  
  return {
    ar: content.ar || '',
    en: content.en || '',
    [toLanguage]: fromContent
  }
}

/**
 * Validate i18n content (at least one language required)
 */
export function validateI18nContent(content: I18nContent | I18nContentOptional): boolean {
  if (!content) return false
  
  const ar = content.ar || ''
  const en = content.en || ''
  
  return ar.trim().length > 0 || en.trim().length > 0
}

/**
 * Get language display name
 */
export function getLanguageName(locale: string): string {
  switch (locale) {
    case 'ar':
      return 'العربية'
    case 'en':
      return 'English'
    default:
      return locale
  }
}

/**
 * Get language flag emoji
 */
export function getLanguageFlag(locale: string): string {
  switch (locale) {
    case 'ar':
      return '🇰🇼'
    case 'en':
      return '🇺🇸'
    default:
      return '🌐'
  }
}
