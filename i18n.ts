import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => {
  // Load messages for the current locale
  const messages = locale === 'ar' 
    ? (await import('./messages/ar.json')).default
    : (await import('./messages/en.json')).default

  return {
    messages,
    locale: locale || 'en'
  }
})
