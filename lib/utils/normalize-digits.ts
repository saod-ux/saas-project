/**
 * Normalize Arabic/Eastern digits to Western digits
 * Converts ٠١٢٣٤٥٦٧٨٩ to 0123456789
 */
export function normalizeDigits(input: string): string {
  if (!input || typeof input !== 'string') return input;
  
  const arabicToWestern: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  return input.replace(/[٠-٩]/g, (digit) => arabicToWestern[digit] || digit);
}

/**
 * Normalize numeric input for forms (price, quantity, etc.)
 */
export function normalizeNumericInput(input: string): string {
  return normalizeDigits(input).replace(/[^\d.-]/g, '');
}

/**
 * Parse normalized numeric string to number
 */
export function parseNumericInput(input: string): number {
  const normalized = normalizeNumericInput(input);
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
