/**
 * String utility functions
 * Example module to demonstrate unit testing
 */

/**
 * Converts a string to title case
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Sanitizes email address for CSV export
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Formats a phone number to E.164 format
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Joins array items with a delimiter, filtering out empty values
 */
export function joinWithDelimiter(items: (string | null | undefined)[], delimiter = ';'): string {
  return items.filter((item) => item && item.trim()).join(delimiter);
}

/**
 * Truncates a string to a maximum length
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
