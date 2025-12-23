/**
 * Currency utility functions
 * All values are stored and calculated in cents (integers) to avoid floating point issues
 */

/**
 * Convert reais (decimal) to cents (integer)
 * R$ 1.234,56 -> 123456
 */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/**
 * Convert cents (integer) to reais (decimal)
 * 123456 -> 1234.56
 */
export function centsToReais(cents: number): number {
  return cents / 100;
}

/**
 * Parse a Brazilian currency string to cents
 * "R$ 1.234,56" -> 123456
 * "1234,56" -> 123456
 * "1234.56" -> 123456
 */
export function parseCurrencyToCents(value: string): number {
  if (!value) return 0;
  // Remove everything except digits
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10);
}

/**
 * Parse a Brazilian currency string to reais (for backward compatibility)
 * "R$ 1.234,56" -> 1234.56
 */
export function parseCurrencyToReais(value: string): number {
  return centsToReais(parseCurrencyToCents(value));
}

/**
 * Format cents to Brazilian currency string
 * 123456 -> "R$ 1.234,56"
 */
export function formatCentsToDisplay(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centsToReais(cents));
}

/**
 * Format reais to Brazilian currency string
 * 1234.56 -> "R$ 1.234,56"
 */
export function formatReaisToDisplay(reais: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(reais);
}

/**
 * Format input as currency while typing
 * Converts raw digits to formatted currency string
 * "123456" -> "R$ 1.234,56"
 */
export function formatCurrencyInput(input: string): string {
  const cents = parseCurrencyToCents(input);
  if (cents === 0) return "";
  return formatCentsToDisplay(cents);
}

/**
 * Calculate installment value from total value in cents
 * Returns value in cents, rounded properly
 */
export function calculateInstallmentCents(totalCents: number, installments: number): number {
  if (installments <= 0) return totalCents;
  return Math.round(totalCents / installments);
}

/**
 * Calculate total value from installment value in cents
 * Returns value in cents
 */
export function calculateTotalFromInstallmentCents(installmentCents: number, installments: number): number {
  return installmentCents * installments;
}

/**
 * Validate installment values to prevent errors
 * Returns corrected values if needed
 */
export function validateInstallmentValues(
  totalCents: number,
  installmentCents: number,
  installments: number
): { totalCents: number; installmentCents: number } {
  if (installments <= 1) {
    return { totalCents, installmentCents: totalCents };
  }
  
  // If total is less than or equal to installment (error case), recalculate
  if (totalCents <= installmentCents && installments > 1) {
    // Assume installment value is correct, recalculate total
    return {
      totalCents: installmentCents * installments,
      installmentCents,
    };
  }
  
  // Verify that total equals installments * installment_value (with small tolerance for rounding)
  const expectedTotal = installmentCents * installments;
  const tolerance = installments; // Allow 1 cent per installment for rounding
  
  if (Math.abs(totalCents - expectedTotal) > tolerance) {
    // Values don't match, prefer installment value and recalculate total
    return {
      totalCents: installmentCents * installments,
      installmentCents,
    };
  }
  
  return { totalCents, installmentCents };
}
