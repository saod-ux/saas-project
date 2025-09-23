'use client'

import { useLocale } from '@/components/providers/LocaleProvider'
import { pickI18n, isMissingLanguage } from '@/lib/i18n-utils'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

interface BilingualContentDisplayProps {
  content: any // Can be I18nContent, string, or any object with ar/en keys
  fallback?: string
  className?: string
  showMissingWarning?: boolean
  multiline?: boolean
}

export default function BilingualContentDisplay({
  content,
  fallback = 'en',
  className = '',
  showMissingWarning = false,
  multiline = false
}: BilingualContentDisplayProps) {
  const { locale } = useLocale()
  
  // Extract the localized content
  const localizedContent = pickI18n(content, locale, fallback)
  
  // Check if the current locale is missing
  const isCurrentLocaleMissing = isMissingLanguage(content, locale as 'en' | 'ar')
  
  // Check if fallback locale is missing
  const isFallbackMissing = isMissingLanguage(content, fallback as 'en' | 'ar')
  
  // Determine if we should show a warning
  const shouldShowWarning = showMissingWarning && isCurrentLocaleMissing && !isFallbackMissing

  if (multiline) {
    return (
      <div className={className}>
        {shouldShowWarning && (
          <Badge variant="destructive" className="mb-2 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'Arabic content missing, showing English' : 'English content missing, showing Arabic'}
          </Badge>
        )}
        <div className="whitespace-pre-wrap">{localizedContent}</div>
      </div>
    )
  }

  return (
    <div className={className}>
      {shouldShowWarning && (
        <Badge variant="destructive" className="mb-2 text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          {locale === 'ar' ? 'Arabic content missing, showing English' : 'English content missing, showing Arabic'}
        </Badge>
      )}
      <span>{localizedContent}</span>
    </div>
  )
}
