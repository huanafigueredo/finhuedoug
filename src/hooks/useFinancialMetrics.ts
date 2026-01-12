import { useMemo } from "react";
import { usePersonNames } from "./useUserSettings";
import { useSplitCalculation } from "./useSplitCalculation";
import { shouldShowInMonth, getTransactionMonthValue } from "@/lib/transactionUtils";

export interface FinancialMetrics {
  // Total geral
  totalExpenses: number;
  totalIncome: number;
  totalBalance: number;
  
  // Despesas do casal (is_couple = true)
  coupleExpenses: number;
  
  // Despesas individuais (excluindo casal)
  person1IndividualExpenses: number;
  person2IndividualExpenses: number;
  
  // Split amounts from couple expenses (based on split settings)
  person1CoupleShare: number;
  person2CoupleShare: number;
  
  // Total por pessoa (individual + share of couple)
  person1TotalExpenses: number;
  person2TotalExpenses: number;
  
  // Receitas por pessoa
  person1Income: number;
  person2Income: number;
  
  // Saldo por pessoa (receitas - despesas incluindo share do casal)
  person1Balance: number;
  person2Balance: number;
  
  // Nomes das pessoas
  person1Name: string;
  person2Name: string;
  
  // Split info
  splitMode: string;
  person1Percentage: number;
  person2Percentage: number;
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
  installment_number?: number | null;
  total_installments?: number | null;
  is_generated_installment?: boolean | null;
  savings_deposit_id?: string | null;
  category?: string | null;
  subcategory?: string | null;
  custom_person1_percentage?: number | null;
  custom_person2_percentage?: number | null;
  [key: string]: any;
}

export function useFinancialMetrics(
  transactions: Transaction[],
  selectedMonth?: number, // 0-indexed
  selectedYear?: number
): FinancialMetrics {
  const { person1, person2 } = usePersonNames();
  const { calculateSplitForTransaction, currentPercentages, mode } = useSplitCalculation();
  
  return useMemo(() => {
    // Filter transactions by month/year if provided (including dynamic installments)
    let filtered = transactions;
    
    if (selectedMonth !== undefined && selectedYear !== undefined) {
      filtered = transactions.filter((t) => shouldShowInMonth(t, selectedMonth, selectedYear));
    }

    // Helper to check if transaction is a savings goal deposit (internal transfer)
    const isSavingsTransfer = (t: Transaction) => !!t.savings_deposit_id;

    // Total expenses (all) - use month value for installments
    // Exclude savings goal deposits (internal transfers)
    const totalExpenses = filtered
      .filter((t) => t.type === "expense" && !isSavingsTransfer(t))
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    // Total income (all)
    const totalIncome = filtered
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    const totalBalance = totalIncome - totalExpenses;

    // Couple expenses (is_couple = true) - to be split according to settings
    // Exclude savings goal deposits
    const coupleTransactions = filtered.filter(
      (t) => t.type === "expense" && t.is_couple === true && !isSavingsTransfer(t)
    );

    const coupleExpenses = coupleTransactions.reduce(
      (sum, t) => sum + getTransactionMonthValue(t),
      0
    );
    
    // Calculate split for each couple transaction using category-aware split
    let person1CoupleShare = 0;
    let person2CoupleShare = 0;

    for (const t of coupleTransactions) {
      const value = getTransactionMonthValue(t);
      const split = calculateSplitForTransaction(
        value, 
        t.category, 
        t.subcategory,
        t.custom_person1_percentage,
        t.custom_person2_percentage
      );
      person1CoupleShare += split.person1;
      person2CoupleShare += split.person2;
    }

    // Individual expenses for Person 1 (excluding couple purchases and savings transfers)
    const person1IndividualExpenses = filtered
      .filter((t) => t.type === "expense" && t.for_who === person1 && !t.is_couple && !isSavingsTransfer(t))
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    // Individual expenses for Person 2 (excluding couple purchases and savings transfers)
    const person2IndividualExpenses = filtered
      .filter((t) => t.type === "expense" && t.for_who === person2 && !t.is_couple && !isSavingsTransfer(t))
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    // Total expenses per person = individual + share of couple
    const person1TotalExpenses = person1IndividualExpenses + person1CoupleShare;
    const person2TotalExpenses = person2IndividualExpenses + person2CoupleShare;

    // Income per person
    const person1Income = filtered
      .filter((t) => t.type === "income" && t.for_who === person1)
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    const person2Income = filtered
      .filter((t) => t.type === "income" && t.for_who === person2)
      .reduce((sum, t) => sum + getTransactionMonthValue(t), 0);

    // Balance per person = income - expenses (including share of couple)
    const person1Balance = person1Income - person1TotalExpenses;
    const person2Balance = person2Income - person2TotalExpenses;

    return {
      totalExpenses,
      totalIncome,
      totalBalance,
      coupleExpenses,
      person1CoupleShare,
      person2CoupleShare,
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
      splitMode: mode,
      person1Percentage: currentPercentages.person1Percentage,
      person2Percentage: currentPercentages.person2Percentage,
    };
  }, [transactions, selectedMonth, selectedYear, person1, person2, calculateSplitForTransaction, currentPercentages, mode]);
}
