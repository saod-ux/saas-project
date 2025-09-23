"use client";

import { useEffect } from "react";

interface TenantRTLProviderProps {
  children: React.ReactNode;
  locale?: string;
  direction?: 'ltr' | 'rtl';
}

export function TenantRTLProvider({ 
  children, 
  locale = 'en-US',
  direction = 'ltr'
}: TenantRTLProviderProps) {
  useEffect(() => {
    // Set document direction and language based on tenant settings
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.lang = locale;
      
      // Set font family based on locale
      if (locale.startsWith('ar')) {
        document.documentElement.style.fontFamily = 'Cairo, system-ui, sans-serif';
      } else {
        document.documentElement.style.fontFamily = 'Inter, system-ui, sans-serif';
      }
    }
  }, [locale, direction]);

  return <>{children}</>;
}


