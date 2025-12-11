import { useMemo } from "react";
import { parseISO } from "date-fns";

export interface FinancialMetrics {
  // Total geral
  totalExpenses: number;
  totalIncome: number;
  totalBalance: number;
  
  // Despesas do casal (is_couple = true)
  coupleExpenses: number;
  halfCoupleExpenses: number;
  
  // Despesas individuais (excluindo casal)
  huanaIndividualExpenses: number;
  douglasIndividualExpenses: number;
  
  // Total por pessoa (individual + metade do casal)
  huanaTotalExpenses: number;
  douglasTotalExpenses: number;
  
  // Receitas por pessoa
  huanaIncome: number;
  douglasIncome: number;
  
  // Saldo por pessoa (receitas - despesas incluindo metade do casal)
  huanaBalance: number;
  douglasBalance: number;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  total_value: number;
  for_who?: string | null;
  is_couple?: boolean | null;
  [key: string]: any;
}

export function useFinancialMetrics(
  transactions: Transaction[],
  selectedMonth?: number, // 0-indexed
  selectedYear?: number
): FinancialMetrics {
  return useMemo(() => {
    // Filter transactions by month/year if provided
    let filtered = transactions;
    
    if (selectedMonth !== undefined && selectedYear !== undefined) {
      filtered = transactions.filter((t) => {
        const date = parseISO(t.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    }

    // Total expenses (all)
    const totalExpenses = filtered
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.total_value), 0);

    // Total income (all)
    const totalIncome = filtered
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.total_value), 0);

    const totalBalance = totalIncome - totalExpenses;

    // Couple expenses (is_couple = true) - to be split 50/50
    const coupleExpenses = filtered
      .filter((t) => t.type === "expense" && t.is_couple === true)
      .reduce((sum, t) => sum + Number(t.total_value), 0);
    
    const halfCoupleExpenses = coupleExpenses / 2;

    // Individual expenses for Huana (excluding couple purchases)
    const huanaIndividualExpenses = filtered
      .filter((t) => t.type === "expense" && t.for_who === "Huana" && !t.is_couple)
      .reduce((sum, t) => sum + Number(t.total_value), 0);

    // Individual expenses for Douglas (excluding couple purchases)
    const douglasIndividualExpenses = filtered
      .filter((t) => t.type === "expense" && t.for_who === "Douglas" && !t.is_couple)
      .reduce((sum, t) => sum + Number(t.total_value), 0);

    // Total expenses per person = individual + half of couple
    const huanaTotalExpenses = huanaIndividualExpenses + halfCoupleExpenses;
    const douglasTotalExpenses = douglasIndividualExpenses + halfCoupleExpenses;

    // Income per person
    const huanaIncome = filtered
      .filter((t) => t.type === "income" && t.for_who === "Huana")
      .reduce((sum, t) => sum + Number(t.total_value), 0);

    const douglasIncome = filtered
      .filter((t) => t.type === "income" && t.for_who === "Douglas")
      .reduce((sum, t) => sum + Number(t.total_value), 0);

    // Balance per person = income - expenses (including half of couple)
    const huanaBalance = huanaIncome - huanaTotalExpenses;
    const douglasBalance = douglasIncome - douglasTotalExpenses;

    return {
      totalExpenses,
      totalIncome,
      totalBalance,
      coupleExpenses,
      halfCoupleExpenses,
      huanaIndividualExpenses,
      douglasIndividualExpenses,
      huanaTotalExpenses,
      douglasTotalExpenses,
      huanaIncome,
      douglasIncome,
      huanaBalance,
      douglasBalance,
    };
  }, [transactions, selectedMonth, selectedYear]);
}
