/**
 * Arabic Numeral Utilities
 * 
 * Handles conversion between Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) 
 * and Western Arabic numerals (0123456789)
 */

// Arabic-Indic to Western Arabic numeral mapping
const ARABIC_TO_WESTERN: Record<string, string> = {
  '٠': '0',
  '١': '1', 
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

// Western Arabic to Arabic-Indic numeral mapping
const WESTERN_TO_ARABIC: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢', 
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩'
};

/**
 * Convert Arabic-Indic numerals to Western Arabic numerals
 * @param input - String containing Arabic-Indic numerals
 * @returns String with Western Arabic numerals
 */
export function arabicToWestern(input: string): string {
  if (!input || typeof input !== 'string') return input;
  
  return input.replace(/[٠-٩]/g, (char) => ARABIC_TO_WESTERN[char] || char);
}

/**
 * Convert Western Arabic numerals to Arabic-Indic numerals
 * @param input - String containing Western Arabic numerals
 * @returns String with Arabic-Indic numerals
 */
export function westernToArabic(input: string): string {
  if (!input || typeof input !== 'string') return input;
  
  return input.replace(/[0-9]/g, (char) => WESTERN_TO_ARABIC[char] || char);
}

/**
 * Normalize numeric input by converting Arabic-Indic to Western numerals
 * and parsing as a number
 * @param input - String containing numerals (Arabic-Indic or Western)
 * @returns Parsed number or NaN if invalid
 */
export function normalizeNumericInput(input: string): number {
  if (!input || typeof input !== 'string') return NaN;
  
  // Convert Arabic-Indic to Western numerals
  const normalized = arabicToWestern(input);
  
  // Remove any non-numeric characters except decimal point and minus sign
  const cleaned = normalized.replace(/[^\d.-]/g, '');
  
  // Parse as number
  return parseFloat(cleaned);
}

/**
 * Check if a string contains Arabic-Indic numerals
 * @param input - String to check
 * @returns True if contains Arabic-Indic numerals
 */
export function containsArabicNumerals(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return /[٠-٩]/.test(input);
}

/**
 * Format a number for display in Arabic locale
 * @param num - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted string with Arabic-Indic numerals
 */
export function formatArabicNumber(num: number, options?: Intl.NumberFormatOptions): string {
  if (isNaN(num)) return '0';
  
  const formatter = new Intl.NumberFormat('ar-KW', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    ...options
  });
  
  return formatter.format(num);
}

/**
 * Format currency for Arabic display
 * @param amount - Amount to format
 * @param currency - Currency code (default: KWD)
 * @returns Formatted currency string with Arabic-Indic numerals
 */
export function formatArabicCurrency(amount: number, currency: string = 'KWD'): string {
  if (isNaN(amount)) return '0.000 KWD';
  
  const formatter = new Intl.NumberFormat('ar-KW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  
  return formatter.format(amount);
}

