import { useMemo } from "react";
import { parseISO } from "date-fns";
import { usePersonNames } from "./useUserSettings";

export interface FinancialMetrics {
  // Total geral
  totalExpenses: number;
  totalIncome: number;
  totalBalance: number;
  
  // Despesas do casal (is_couple = true)
  coupleExpenses: number;
  halfCoupleExpenses: number;
  
  // Despesas individuais (excluindo casal)
  person1IndividualExpenses: number;
  person2IndividualExpenses: number;
  
  // Total por pessoa (individual + metade do casal)
  person1TotalExpenses: number;
  person2TotalExpenses: number;
  
  // Receitas por pessoa
  person1Income: number;
  person2Income: number;
  
  // Saldo por pessoa (receitas - despesas incluindo metade do casal)
  person1Balance: number;
  person2Balance: number;
  
  // Nomes das pessoas
  person1Name: string;
  person2Name: string;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  total_value: number;
  for_who?: string | null;
  is_couple?: boolean | null;
  is_installment?: boolean | null;
  installment_value?: number | null;
  is_generated_installment?: boolean | null;
  [key: string]: any;
}

// Helper: get the value to use for a transaction in a specific month
// For installment transactions (single-record style), use installment_value
// For regular transactions, use total_value
function getTransactionMonthValue(t: Transaction): number {
  // New-style installment: single record with installment_value
  if (t.is_installment && t.installment_value && !t.is_generated_installment) {
    return Number(t.installment_value);
  }
  // Regular transaction or old-style installment (already has correct value per record)
  return Number(t.total_value);
}

export function useFinancialMetrics(
  transactions: Transaction[],
  selectedMonth?: number, // 0-indexed
  selectedYear?: number
): FinancialMetrics {
  const { person1, person2 } = usePersonNames();
  
  return useMemo(() => {
    // Filter transactions by month/year if provided
    let filtered = transactions;
    
    if (selectedMonth !== undefined && selectedYear !== undefined) {
      filtered = transactions.filter((t) => {
        const date = parseISO(t.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    }

    // Total expenses (all) - use month value for installments
    const totalExpenses = filtered
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    // Total income (all)
    const totalIncome = filtered
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    const totalBalance = totalIncome - totalExpenses;

    // Couple expenses (is_couple = true) - to be split 50/50
    const coupleExpenses = filtered
      .filter((t) => t.type === "expense" && t.is_couple === true)
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);
    
    const halfCoupleExpenses = coupleExpenses / 2;

    // Individual expenses for Person 1 (excluding couple purchases)
    const person1IndividualExpenses = filtered
      .filter((t) => t.type === "expense" && t.for_who === person1 && !t.is_couple)
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    // Individual expenses for Person 2 (excluding couple purchases)
    const person2IndividualExpenses = filtered
      .filter((t) => t.type === "expense" && t.for_who === person2 && !t.is_couple)
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    // Total expenses per person = individual + half of couple
    const person1TotalExpenses = person1IndividualExpenses + halfCoupleExpenses;
    const person2TotalExpenses = person2IndividualExpenses + halfCoupleExpenses;

    // Income per person
    const person1Income = filtered
      .filter((t) => t.type === "income" && t.for_who === person1)
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    const person2Income = filtered
      .filter((t) => t.type === "income" && t.for_who === person2)
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    // Balance per person = income - expenses (including half of couple)
    const person1Balance = person1Income - person1TotalExpenses;
    const person2Balance = person2Income - person2TotalExpenses;

    return {
      totalExpenses,
      totalIncome,
      totalBalance,
      coupleExpenses,
      halfCoupleExpenses,
      person1IndividualExpenses,
      person2IndividualExpenses,
      person1TotalExpenses,
      person2TotalExpenses,
      person1Income,
      person2Income,
      person1Balance,
      person2Balance,
      person1Name: person1,
      person2Name: person2,
    };
  }, [transactions, selectedMonth, selectedYear, person1, person2]);
}
