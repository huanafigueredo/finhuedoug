import { useMemo, useCallback } from "react";
import { useCategoryBudgets } from "./useCategoryBudgets";
import { useCategories } from "./useCategories";
import { useSplitSettings } from "./useSplitSettings";
import { useCoupleMembers } from "./useCoupleMembers";
import { useCategorySplits, getCategorySplit } from "./useCategorySplits";
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

function getBaseMonthValueInCents(t: Transaction): number {
  // Para transações parceladas, usar o valor da parcela
  // Converter de Reais para centavos (valores no banco estão em Reais)
  let value: number;
  if (t.is_installment && t.installment_value && !t.is_generated_installment) {
    value = Number(t.installment_value);
  } else {
    value = Number(t.total_value);
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
  const { data: splitSettings } = useSplitSettings();
  const { data: members = [] } = useCoupleMembers();
  const { data: categorySplits = [] } = useCategorySplits();

  // Calculate split for a given category - memoized callback
  const calculateSplitForCategory = useCallback(
    (
      valueInCents: number, 
      category?: string | null, 
      subcategory?: string | null,
      customP1?: number | null,
      customP2?: number | null
    ): { person1: number; person2: number } => {
      // Priority 1: Check for transaction-level custom split first
      if (customP1 !== undefined && customP1 !== null &&
          customP2 !== undefined && customP2 !== null) {
        return {
          person1: Math.round(valueInCents * (customP1 / 100)),
          person2: Math.round(valueInCents * (customP2 / 100)),
        };
      }

      // Priority 2: Check for category-specific rule
      const categoryRule = getCategorySplit(categorySplits, category, subcategory);
      
      if (categoryRule) {
        const p1Pct = categoryRule.person1_percentage;
        const p2Pct = categoryRule.person2_percentage;
        return {
          person1: Math.round(valueInCents * (p1Pct / 100)),
          person2: Math.round(valueInCents * (p2Pct / 100)),
        };
      }

      // Priority 3: Fallback to global settings
      const mode = splitSettings?.mode || "50-50";

      if (mode === "proporcional") {
        const person1 = members.find((m) => m.position === 1);
        const person2 = members.find((m) => m.position === 2);
        const income1 = person1?.monthly_income_cents || 0;
        const income2 = person2?.monthly_income_cents || 0;
        const totalIncome = income1 + income2;

        if (totalIncome === 0) {
          return { person1: valueInCents / 2, person2: valueInCents / 2 };
        }

        return {
          person1: Math.round(valueInCents * (income1 / totalIncome)),
          person2: Math.round(valueInCents * (income2 / totalIncome)),
        };
      }

      if (mode === "personalizado" && splitSettings) {
        const p1Pct = splitSettings.person1_percentage || 50;
        const p2Pct = splitSettings.person2_percentage || 50;
        return {
          person1: Math.round(valueInCents * (p1Pct / 100)),
          person2: Math.round(valueInCents * (p2Pct / 100)),
        };
      }

      // Default 50-50
      return { person1: valueInCents / 2, person2: valueInCents / 2 };
    },
    [categorySplits, splitSettings, members]
  );

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

    // Calcular gastos por categoria (em centavos) using split rules
    const spentByCategory: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      const cat = t.category || "Outros";
      const baseValue = getBaseMonthValueInCents(t);
      
      let valueToAdd = baseValue;
      // Apply split rules for individual filters with couple expenses
      if (personFilter !== "all" && personFilter !== "couple" && t.is_couple) {
        const split = calculateSplitForCategory(
          baseValue, 
          t.category, 
          t.subcategory,
          t.custom_person1_percentage,
          t.custom_person2_percentage
        );
        valueToAdd = personFilter === "person1" ? split.person1 : split.person2;
      }
      
      spentByCategory[cat] = (spentByCategory[cat] || 0) + valueToAdd;
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
  }, [transactions, budgets, categories, monthIndex, year, personFilter, person1Name, person2Name, calculateSplitForCategory]);
}
