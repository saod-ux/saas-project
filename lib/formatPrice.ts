export function formatPrice(
  amount: number,
  currency: string = 'KWD',
  locale: 'ar-KW' | 'en-US' = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatPriceRange(
  minAmount: number,
  maxAmount: number,
  currency: string = 'KWD',
  locale: 'ar-KW' | 'en-US' = 'en-US'
): string {
  if (minAmount === maxAmount) {
    return formatPrice(minAmount, currency, locale)
  }
  return `${formatPrice(minAmount, currency, locale)} - ${formatPrice(maxAmount, currency, locale)}`
}
