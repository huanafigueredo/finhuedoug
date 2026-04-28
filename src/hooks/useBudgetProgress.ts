import { useMemo, useCallback } from "react";
import { useCategoryBudgets } from "./useCategoryBudgets";
import { useCategories } from "./useCategories";
import { useSplitSettings } from "./useSplitSettings";
import { useCoupleMembers } from "./useCoupleMembers";
import { useCategorySplits, getCategorySplit } from "./useCategorySplits";
import { Transaction } from "./useTransactions";
import { shouldShowInMonth } from "@/lib/transactionUtils";

export type BudgetStatus = "ok" | "warning" | "exceeded";

export type PersonFilter = "all" | "person1" | "person2" | "couple";

export type PacingStatus = "normal" | "fast" | "danger";

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  originalBudgeted: number; // limite base
  budgeted: number; // limite base + rollover (em centavos)
  spent: number; // em centavos
  percentage: number;
  status: BudgetStatus;
  remaining: number; // em centavos (pode ser negativo)
  rollover: number; // quanto acumulou/perdeu dos meses anteriores
  pacingStatus: PacingStatus; // ritmo de gasto vs dias do mês
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
  // Para transações parceladas, usar o valor da parcela se disponível
  if (t.is_installment) {
    // Se tiver valor de parcela explícito, usa ele
    if (t.installment_value) {
      return Math.round(Number(t.installment_value) * 100);
    }
    // Se não tiver (fallback defensivo), tenta calcular do total
    if (t.total_value && t.total_installments) {
      return Math.round((Number(t.total_value) * 100) / Number(t.total_installments));
    }
  }

  // Caso padrão: total_value * 100 (para centavos)
  return Math.round(Number(t.total_value) * 100);
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
    // Filtrar transações do mês/ano selecionado usando shouldShowInMonth (inclui parcelamentos dinâmicos)
    const monthTransactions = transactions.filter((t) => {
      // First check if transaction should appear in this month (handles installments)
      if (!shouldShowInMonth(t, monthIndex, year)) return false;

      // Must be expense type
      if (t.type !== "expense") return false;

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

    // --- ROLLOVER CALCULATION ---
    const pastSpentByCategory: Record<string, number> = {};
    const monthsActiveSet = new Set<string>();

    transactions.forEach((t) => {
      // Must be expense and not savings
      if (t.type !== "expense" || t.savings_deposit_id) return;
      
      const tDate = new Date(t.date);
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();
      
      // Check if transaction is from a strictly previous month
      if (tYear < year || (tYear === year && tMonth < monthIndex)) {
        monthsActiveSet.add(`${tYear}-${tMonth}`);
        
        const cat = t.category || "Outros";
        const baseValue = getBaseMonthValueInCents(t);
        
        let valueToAdd = baseValue;
        if (personFilter !== "all" && personFilter !== "couple" && t.is_couple) {
          const split = calculateSplitForCategory(baseValue, t.category, t.subcategory, t.custom_person1_percentage, t.custom_person2_percentage);
          valueToAdd = personFilter === "person1" ? split.person1 : split.person2;
        }
        pastSpentByCategory[cat] = (pastSpentByCategory[cat] || 0) + valueToAdd;
      }
    });
    const activePastMonthsCount = monthsActiveSet.size;
    // --- END ROLLOVER CALCULATION ---

    // Pacing calculations setup
    const today = new Date();
    const isCurrentMonth = today.getMonth() === monthIndex && today.getFullYear() === year;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
    const monthProgressRatio = currentDay / daysInMonth;

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

      let baseBudget = budget.budget_amount;

      switch (personFilter) {
        case "person1":
          baseBudget = budget.person1_budget || 0;
          break;
        case "person2":
          baseBudget = budget.person2_budget || 0;
          break;
        case "couple":
          baseBudget = budget.couple_budget || 0;
          break;
        default:
          baseBudget = budget.budget_amount;
      }

      const pastSpent = pastSpentByCategory[categoryName] || 0;
      const pastBudgeted = baseBudget * activePastMonthsCount;
      const rollover = activePastMonthsCount > 0 ? (pastBudgeted - pastSpent) : 0;
      
      // Effective budget includes rollover bonus/deficit
      const effectiveBudget = Math.max(0, baseBudget + rollover); 

      const spent = spentByCategory[categoryName] || 0;
      const percentage = effectiveBudget > 0 ? Math.round((spent / effectiveBudget) * 100) : 0;
      const remaining = effectiveBudget - spent;

      let status: BudgetStatus = "ok";
      if (effectiveBudget > 0 && percentage >= 100) {
        status = "exceeded";
      } else if (effectiveBudget > 0 && percentage >= 80) {
        status = "warning";
      }

      if (effectiveBudget === 0 && spent > 0) {
        status = "exceeded";
      }

      // Pacing alert (only applies if we are in the current month and there's a budget)
      let pacingStatus: PacingStatus = "normal";
      if (isCurrentMonth && effectiveBudget > 0 && spent > 0) {
        const spendRatio = spent / effectiveBudget;
        if (spendRatio > monthProgressRatio * 1.3) {
          pacingStatus = "danger"; // Gastando 30% mais rápido que o esperado
        } else if (spendRatio > monthProgressRatio * 1.1) {
          pacingStatus = "fast"; // Gastando 10% mais rápido que o esperado
        }
      }

      return {
        categoryId: budget.category_id,
        categoryName,
        originalBudgeted: baseBudget,
        budgeted: effectiveBudget,
        spent,
        percentage,
        status,
        remaining,
        rollover,
        pacingStatus
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
