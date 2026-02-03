import { addMonths, setDate } from "date-fns";

/**
 * Calculates the reference date (competence month) for a transaction based on the card's closing day.
 * 
 * Logic:
 * - If transaction day >= closing day: Belongs to next month's invoice.
 * - If transaction day < closing day: Belongs to current month's invoice.
 * 
 * Example:
 * Closing Day: 05
 * Purchase: 03/Jan -> Invoice: Jan
 * Purchase: 06/Jan -> Invoice: Feb
 * 
 * @param transactionDate The date of the transaction
 * @param closingDay The closing day of the credit card (1-31)
 * @returns A Date object representing the first day of the reference month
 */
export function getInvoiceReferenceDate(transactionDate: Date, closingDay: number): Date {
    // Ensure we're working with a date object
    const date = new Date(transactionDate);
    const day = date.getDate();

    if (day >= closingDay) {
        // Moves to next month
        const nextMonth = addMonths(date, 1);
        // Return first day of that month for consistent filtering
        return setDate(nextMonth, 1);
    }

    // Stays in current month
    return setDate(date, 1);
}

/**
 * Helper to determine if a transaction should be visible in a given month/year filter
 * considering the credit card logic.
 * 
 * @param transactionDate Transaction date
 * @param closingDay Card closing day (nullable)
 * @param filterMonth Filter month (1-12)
 * @param filterYear Filter year (e.g., 2024)
 */
export function shouldShowTransaction(
    transactionDate: Date | string,
    closingDay: number | null | undefined,
    filterMonth: number,
    filterYear: number
): boolean {
    if (!closingDay) {
        // If no closing day (not a credit card), compare simpler dates
        const date = new Date(transactionDate);
        return date.getMonth() + 1 === filterMonth && date.getFullYear() === filterYear;
    }

    const invoiceDate = getInvoiceReferenceDate(new Date(transactionDate), closingDay);
    return invoiceDate.getMonth() + 1 === filterMonth && invoiceDate.getFullYear() === filterYear;
}
