import { useMemo } from "react";
import { useCategoryBudgets } from "./useCategoryBudgets";
import { useCategories } from "./useCategories";
import { Transaction } from "./useTransactions";
import { parseISO } from "date-fns";

export type BudgetStatus = "ok" | "warning" | "exceeded";

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  budgeted: number; // em centavos
  spent: number; // em centavos
  percentage: number;
  status: BudgetStatus;
  remaining: number; // em centavos (pode ser negativo)
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  budgetProgress: BudgetProgress[];
  hasWarnings: boolean;
  hasExceeded: boolean;
}

function getMonthValue(t: Transaction): number {
  // Para transações parceladas, usar o valor da parcela
  if (t.is_installment && t.installment_value && !t.is_generated_installment) {
    return Number(t.installment_value);
  }
  return Number(t.total_value);
}

export function useBudgetProgress(
  transactions: Transaction[],
  monthIndex: number,
  year: number
): BudgetSummary {
  const { data: budgets = [] } = useCategoryBudgets();
  const { data: categories = [] } = useCategories("expense");

  return useMemo(() => {
    // Filtrar transações do mês/ano selecionado
    const monthTransactions = transactions.filter((t) => {
      const date = parseISO(t.date);
      return (
        date.getMonth() === monthIndex &&
        date.getFullYear() === year &&
        t.type === "expense"
      );
    });

    // Calcular gastos por categoria
    const spentByCategory: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      const cat = t.category || "Outros";
      spentByCategory[cat] = (spentByCategory[cat] || 0) + getMonthValue(t);
    });

    // Mapear orçamentos com progresso
    const budgetProgress: BudgetProgress[] = budgets.map((budget) => {
      const category = categories.find((c) => c.id === budget.category_id);
      const categoryName = category?.name || "Categoria";
      const budgeted = budget.budget_amount;
      const spent = spentByCategory[categoryName] || 0;
      const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
      const remaining = budgeted - spent;

      let status: BudgetStatus = "ok";
      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= 80) {
        status = "warning";
      }

      return {
        categoryId: budget.category_id,
        categoryName,
        budgeted,
        spent,
        percentage,
        status,
        remaining,
      };
    });

    // Ordenar: exceeded primeiro, depois warning, depois ok
    budgetProgress.sort((a, b) => {
      const order = { exceeded: 0, warning: 1, ok: 2 };
      return order[a.status] - order[b.status];
    });

    // Calcular totais
    const totalBudgeted = budgetProgress.reduce((sum, b) => sum + b.budgeted, 0);
    const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      budgetProgress,
      hasWarnings: budgetProgress.some((b) => b.status === "warning"),
      hasExceeded: budgetProgress.some((b) => b.status === "exceeded"),
    };
  }, [transactions, budgets, categories, monthIndex, year]);
}
