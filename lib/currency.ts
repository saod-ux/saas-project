/**
 * Currency Utilities
 * 
 * Handles currency formatting and conversion for Kuwait (KWD) and other currencies
 * KWD uses 3 decimal places (fils)
 */

export type Currency = 'KWD' | 'USD' | 'EUR' | 'SAR' | 'AED';

export const CURRENCY_CONFIG = {
  KWD: { decimals: 3, symbol: 'د.ك', minorUnit: 'fils' },
  USD: { decimals: 2, symbol: '$', minorUnit: 'cents' },
  EUR: { decimals: 2, symbol: '€', minorUnit: 'cents' },
  SAR: { decimals: 2, symbol: 'ر.س', minorUnit: 'halala' },
  AED: { decimals: 2, symbol: 'د.إ', minorUnit: 'fils' }
} as const;

/**
 * Convert amount from major units to minor units
 * @param amount Amount in major units (e.g., 2.500 KWD)
 * @param currency Currency code
 * @returns Amount in minor units (e.g., 2500 fils)
 */
export function toMinorUnits(amount: number, currency: Currency): number {
  const config = CURRENCY_CONFIG[currency];
  return Math.round(amount * Math.pow(10, config.decimals));
}

/**
 * Convert amount from minor units to major units
 * @param minorAmount Amount in minor units (e.g., 2500 fils)
 * @param currency Currency code
 * @returns Amount in major units (e.g., 2.500 KWD)
 */
export function fromMinorUnits(minorAmount: number, currency: Currency): number {
  const config = CURRENCY_CONFIG[currency];
  return minorAmount / Math.pow(10, config.decimals);
}

/**
 * Format amount for display
 * @param amount Amount in major units
 * @param currency Currency code
 * @param locale Locale for formatting (e.g., 'ar-KW', 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: Currency, 
  locale: string = 'en-US'
): string {
  const config = CURRENCY_CONFIG[currency];
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${config.symbol} ${amount.toFixed(config.decimals)}`;
  }
}

/**
 * Format amount from minor units for display
 * @param minorAmount Amount in minor units
 * @param currency Currency code
 * @param locale Locale for formatting
 * @returns Formatted currency string
 */
export function formatCurrencyFromMinor(
  minorAmount: number,
  currency: Currency,
  locale: string = 'en-US'
): string {
  const amount = fromMinorUnits(minorAmount, currency);
  return formatCurrency(amount, currency, locale);
}

/**
 * Parse currency string to minor units
 * @param currencyString Formatted currency string
 * @param currency Currency code
 * @returns Amount in minor units
 */
export function parseCurrencyToMinor(
  currencyString: string,
  currency: Currency
): number {
  // Remove currency symbols and spaces
  const cleanString = currencyString
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  
  const amount = parseFloat(cleanString);
  if (isNaN(amount)) {
    throw new Error('Invalid currency format');
  }
  
  return toMinorUnits(amount, currency);
}

/**
 * Get currency symbol
 * @param currency Currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_CONFIG[currency].symbol;
}

/**
 * Get minor unit name
 * @param currency Currency code
 * @returns Minor unit name (e.g., 'fils', 'cents')
 */
export function getMinorUnitName(currency: Currency): string {
  return CURRENCY_CONFIG[currency].minorUnit;
}

/**
 * Validate currency code
 * @param currency Currency code to validate
 * @returns True if valid currency
 */
export function isValidCurrency(currency: string): currency is Currency {
  return currency in CURRENCY_CONFIG;
}

/**
 * Get all supported currencies
 * @returns Array of supported currency codes
 */
export function getSupportedCurrencies(): Currency[] {
  return Object.keys(CURRENCY_CONFIG) as Currency[];
}


