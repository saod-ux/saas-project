"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale, isArabic } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="border rounded px-2 py-1 text-sm bg-white"
      >
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}