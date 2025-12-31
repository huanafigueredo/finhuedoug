import { useMemo } from "react";
import { useCategoryBudgets } from "./useCategoryBudgets";
import { useCategories } from "./useCategories";
import { Transaction } from "./useTransactions";
import { parseISO } from "date-fns";

export type BudgetStatus = "ok" | "warning" | "exceeded";

export type PersonFilter = "all" | "person1" | "person2" | "couple";

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

function getMonthValueInCents(t: Transaction, personFilter: PersonFilter): number {
  // Para transações parceladas, usar o valor da parcela
  // Converter de Reais para centavos (valores no banco estão em Reais)
  let value: number;
  if (t.is_installment && t.installment_value && !t.is_generated_installment) {
    value = Number(t.installment_value);
  } else {
    value = Number(t.total_value);
  }
  
  // Se filtro é por pessoa individual e é despesa do casal, pegar metade
  if (personFilter !== "all" && personFilter !== "couple" && t.is_couple) {
    value = value / 2;
  }
  
  return Math.round(value * 100);
}

export function useBudgetProgress(
  transactions: Transaction[],
  monthIndex: number,
  year: number,
  personFilter: PersonFilter = "all",
  person1Name: string = "Huana",
  person2Name: string = "Douglas"
): BudgetSummary {
  const { data: budgets = [] } = useCategoryBudgets();
  const { data: categories = [] } = useCategories("expense");

  return useMemo(() => {
    // Filtrar transações do mês/ano selecionado e por pessoa
    const monthTransactions = transactions.filter((t) => {
      const date = parseISO(t.date);
      const isInMonth = date.getMonth() === monthIndex &&
        date.getFullYear() === year &&
        t.type === "expense";
      
      if (!isInMonth) return false;
      
      // Excluir transações de poupança (transferências internas)
      if (t.savings_deposit_id) return false;
      
      // Aplicar filtro de pessoa baseado em paid_by (quem pagou) e for_who (para quem)
      switch (personFilter) {
        case "person1":
          // Transações pagas pela pessoa 1, para a pessoa 1, ou do casal (metade)
          return t.paid_by === person1Name || 
                 t.for_who === person1Name || 
                 t.for_who === "Casal" ||
                 t.is_couple === true;
        case "person2":
          // Transações pagas pela pessoa 2, para a pessoa 2, ou do casal (metade)
          return t.paid_by === person2Name || 
                 t.for_who === person2Name || 
                 t.for_who === "Casal" ||
                 t.is_couple === true;
        case "couple":
          // Apenas transações do casal (for_who = "Casal" ou is_couple = true)
          return t.for_who === "Casal" || t.is_couple === true;
        case "all":
        default:
          return true;
      }
    });

    // Calcular gastos por categoria (em centavos)
    const spentByCategory: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      const cat = t.category || "Outros";
      spentByCategory[cat] = (spentByCategory[cat] || 0) + getMonthValueInCents(t, personFilter);
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
  }, [transactions, budgets, categories, monthIndex, year, personFilter, person1Name, person2Name]);
}
