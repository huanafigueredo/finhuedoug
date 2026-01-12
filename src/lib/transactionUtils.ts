import { parseISO, differenceInMonths } from "date-fns";

/**
 * Represents a transaction with installment information
 */
export interface InstallmentTransaction {
  date: string;
  is_installment?: boolean | null;
  installment_value?: number | null;
  installment_number?: number | null;
  total_installments?: number | null;
  is_generated_installment?: boolean | null;
  total_value: number;
  [key: string]: any;
}

/**
 * Calculate installment info for a given filter month/year
 * 
 * @param firstInstallmentDate - The date of the first installment
 * @param startInstallment - The starting installment number (usually 1 or custom)
 * @param totalInstallments - Total number of installments
 * @param filterMonth - The month to check (1-indexed: 1 = January)
 * @param filterYear - The year to check
 * @returns Object with currentInstallment and isInRange, or null if invalid
 */
export function calculateInstallmentForMonth(
  firstInstallmentDate: Date,
  startInstallment: number,
  totalInstallments: number,
  filterMonth: number,
  filterYear: number
): { currentInstallment: number; isInRange: boolean } | null {
  const firstMonth = firstInstallmentDate.getMonth() + 1;
  const firstYear = firstInstallmentDate.getFullYear();
  
  const filterDate = new Date(filterYear, filterMonth - 1, 1);
  const firstDate = new Date(firstYear, firstMonth - 1, 1);
  const monthsDiff = differenceInMonths(filterDate, firstDate);
  
  const currentInstallment = startInstallment + monthsDiff;
  const isInRange = currentInstallment >= startInstallment && currentInstallment <= totalInstallments;
  
  return { currentInstallment, isInRange };
}

/**
 * Check if a transaction should appear in the filtered month
 * Handles both regular transactions and dynamic installments
 * 
 * @param t - The transaction to check
 * @param filterMonth - The month to check (0-indexed: 0 = January)
 * @param filterYear - The year to check
 * @returns True if the transaction should appear in this month
 */
export function shouldShowInMonth(
  t: InstallmentTransaction,
  filterMonth: number,
  filterYear: number
): boolean {
  const rawDate = parseISO(t.date);
  const isNewStyleInstallment = t.is_installment && t.total_installments && !t.is_generated_installment;
  
  if (isNewStyleInstallment) {
    const startInstallment = t.installment_number || 1;
    const result = calculateInstallmentForMonth(
      rawDate,
      startInstallment,
      t.total_installments!,
      filterMonth + 1, // filterMonth is 0-indexed, function expects 1-indexed
      filterYear
    );
    return result?.isInRange ?? false;
  }
  
  // Regular transaction - match by date
  return rawDate.getMonth() === filterMonth && rawDate.getFullYear() === filterYear;
}

/**
 * Get the monthly value of a transaction
 * For installment transactions (single-record style), returns installment_value
 * For regular transactions, returns total_value
 * 
 * @param t - The transaction
 * @returns The value to use for this month
 */
export function getTransactionMonthValue(t: InstallmentTransaction): number {
  // New-style installment: single record with installment_value
  if (t.is_installment && t.installment_value && !t.is_generated_installment) {
    return Number(t.installment_value);
  }
  // Regular transaction or old-style installment (already has correct value per record)
  return Number(t.total_value);
}
