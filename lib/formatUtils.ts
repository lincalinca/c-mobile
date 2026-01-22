/**
 * Formatting utilities for Australian localisation
 */

/**
 * Format ABN as ## ### ### ###
 * @param abn - ABN string (with or without spaces)
 * @returns Formatted ABN string
 */
export const formatABN = (abn: string | null | undefined): string => {
  if (!abn) return '';
  
  // Remove all spaces and non-digits
  const cleaned = abn.replace(/\D/g, '');
  
  // If not 11 digits, return as-is
  if (cleaned.length !== 11) return abn;
  
  // Format as ## ### ### ###
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
};

/**
 * Format currency as AUD
 * @param cents - Amount in cents
 * @returns Formatted currency string
 */
export const formatCurrency = (cents: number | null | undefined): string => {
  if (cents === null || cents === undefined) return '$0.00';
  const dollars = cents / 100;
  return `$${dollars.toFixed(2)}`;
};

