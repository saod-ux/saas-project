'use client'

import { useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, AlertCircle } from 'lucide-react'
import { 
  I18nContent, 
  I18nContentOptional, 
  isMissingLanguage, 
  copyLanguageContent,
  validateI18nContent 
} from '@/lib/i18n-utils'

interface BilingualContentEditorProps {
  value: I18nContent | I18nContentOptional | string
  onChange: (value: I18nContent) => void
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
  className?: string
}

export default function BilingualContentEditor({
  value,
  onChange,
  label,
  placeholder = '',
  multiline = false,
  required = false,
  className = ''
}: BilingualContentEditorProps) {
  const { locale } = useLocale()
  const [activeTab, setActiveTab] = useState<'en' | 'ar'>('en')
  
  // Convert string value to i18n object if needed
  const i18nValue: I18nContent = typeof value === 'string' 
    ? { en: value, ar: '' }
    : { en: value.en || '', ar: value.ar || '' }

  const handleChange = (language: 'en' | 'ar', newValue: string) => {
    const updated = { ...i18nValue, [language]: newValue }
    onChange(updated)
  }

  const handleCopyFrom = (fromLanguage: 'en' | 'ar', toLanguage: 'en' | 'ar') => {
    const copied = copyLanguageContent(i18nValue, fromLanguage, toLanguage)
    onChange(copied)
    setActiveTab(toLanguage)
  }

  const isEnMissing = isMissingLanguage(i18nValue, 'en')
  const isArMissing = isMissingLanguage(i18nValue, 'ar')
  const isValid = validateI18nContent(i18nValue)

  const renderInput = (language: 'en' | 'ar') => {
    const inputValue = i18nValue[language] || ''
    const isMissing = language === 'en' ? isEnMissing : isArMissing
    
    if (multiline) {
      return (
        <Textarea
          value={inputValue}
          onChange={(e) => handleChange(language, e.target.value)}
          placeholder={placeholder}
          className={`min-h-[100px] ${isMissing ? 'border-red-300' : ''}`}
        />
      )
    }
    
    return (
      <Input
        value={inputValue}
        onChange={(e) => handleChange(language, e.target.value)}
        placeholder={placeholder}
        className={isMissing ? 'border-red-300' : ''}
      />
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {/* Language Status Badges */}
        <div className="flex gap-2">
          {isEnMissing && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              EN Missing
            </Badge>
          )}
          {isArMissing && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              AR Missing
            </Badge>
          )}
          {isValid && !isEnMissing && !isArMissing && (
            <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">
              ✓ Complete
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'en' | 'ar')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="en" className="flex items-center gap-2">
            🇺🇸 English
            {isEnMissing && <span className="text-red-500">⚠</span>}
          </TabsTrigger>
          <TabsTrigger value="ar" className="flex items-center gap-2">
            🇰🇼 العربية
            {isArMissing && <span className="text-red-500">⚠</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="en" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">English Content</span>
            {!isEnMissing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyFrom('en', 'ar')}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy to Arabic
              </Button>
            )}
          </div>
          {renderInput('en')}
        </TabsContent>

        <TabsContent value="ar" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Arabic Content</span>
            {!isArMissing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyFrom('ar', 'en')}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy to English
              </Button>
            )}
          </div>
          {renderInput('ar')}
        </TabsContent>
      </Tabs>

      {/* Validation Message */}
      {!isValid && (
        <p className="text-sm text-red-600">
          At least one language must be provided.
        </p>
      )}
    </div>
  )
}
