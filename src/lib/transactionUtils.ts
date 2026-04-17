import { parseISO, differenceInMonths, addMonths } from "date-fns";

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
  bank_closing_day?: number | null;
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
 * Get detailed installment info for a transaction in a specific month.
 * Uses competence mode only — the transaction date determines its month directly,
 * without any shifting based on bank closing day.
 */
export function getInstallmentDetailsForMonth(
  t: InstallmentTransaction,
  filterMonth: number, // 0-indexed (0=Jan)
  filterYear: number
) {
  // Fix rawDate parsing to avoid timezone issues
  let rawDate: Date;
  if (t.date && t.date.length >= 10) {
    const [y, m, d] = t.date.substring(0, 10).split('-').map(Number);
    rawDate = new Date(y, m - 1, d, 12, 0, 0);
  } else {
    rawDate = parseISO(t.date);
  }

  const isNewStyleInstallment = t.is_installment && t.total_installments && !t.is_generated_installment;
  const filterMonthNum = filterMonth + 1; // 1-indexed for calcs

  if (isNewStyleInstallment) {
    const startInstallment = t.installment_number || 1;

    const calc = calculateInstallmentForMonth(
      rawDate,
      startInstallment,
      t.total_installments!,
      filterMonthNum,
      filterYear
    );
    if (!calc || !calc.isInRange) return null;

    const monthsFromStart = calc.currentInstallment - startInstallment;
    const installmentDate = addMonths(rawDate, monthsFromStart);

    // Use the installment's projected date directly (competence mode)
    const targetMonth = installmentDate.getMonth() + 1;
    const targetYear = installmentDate.getFullYear();

    if (targetMonth === filterMonthNum && targetYear === filterYear) {
      return {
        currentInstallment: calc.currentInstallment,
        installmentDate,
        installmentValue: t.installment_value ? Number(t.installment_value) : Number(t.total_value) / t.total_installments!
      };
    }
    return null;
  }

  // Regular transaction logic — use the raw date directly (competence mode)
  const targetMonth = rawDate.getMonth() + 1;
  const targetYear = rawDate.getFullYear();

  if (targetMonth === filterMonthNum && targetYear === filterYear) {
    return {
      currentInstallment: null,
      installmentDate: rawDate,
      installmentValue: Number(t.total_value)
    };
  }

  return null;
}

/**
 * Check if a transaction should appear in the filtered month
 * Handles both regular transactions and dynamic installments.
 * Uses competence mode — date determines the month directly.
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
  return !!getInstallmentDetailsForMonth(t, filterMonth, filterYear);
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
