import { useCategoryBudgets } from "./useCategoryBudgets";
import { useCategories } from "./useCategories";
import { useTransactions } from "./useTransactions";
import { parseISO } from "date-fns";

export interface BudgetAlertInfo {
  categoryName: string;
  budgeted: number; // centavos
  currentSpent: number; // centavos
  newSpent: number; // centavos após adicionar
  percentage: number;
  status: "ok" | "warning" | "exceeded";
  message: string;
}

export function useBudgetAlert() {
  const { data: budgets = [] } = useCategoryBudgets();
  const { data: categories = [] } = useCategories("expense");
  const { data: transactions = [] } = useTransactions();

  const checkBudgetAlert = (
    categoryName: string,
    valueInCents: number,
    transactionDate: string
  ): BudgetAlertInfo | null => {
    // Encontrar categoria pelo nome
    const category = categories.find((c) => c.name === categoryName);
    if (!category) return null;

    // Encontrar orçamento da categoria
    const budget = budgets.find((b) => b.category_id === category.id);
    if (!budget) return null;

    // Calcular mês/ano da transação
    const date = parseISO(transactionDate);
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    // Calcular gastos atuais no mês
    const currentSpent = transactions
      .filter((t) => {
        const tDate = parseISO(t.date);
        return (
          t.type === "expense" &&
          t.category === categoryName &&
          tDate.getMonth() === monthIndex &&
          tDate.getFullYear() === year
        );
      })
      .reduce((sum, t) => {
        if (t.is_installment && t.installment_value && !t.is_generated_installment) {
          return sum + Number(t.installment_value);
        }
        return sum + Number(t.total_value);
      }, 0);

    const newSpent = currentSpent + valueInCents;
    const budgeted = budget.budget_amount;
    const percentage = Math.round((newSpent / budgeted) * 100);

    let status: "ok" | "warning" | "exceeded" = "ok";
    let message = "";

    if (percentage >= 100) {
      status = "exceeded";
      const excess = newSpent - budgeted;
      message = `⚠️ Esta despesa ultrapassará o orçamento de ${categoryName} em R$ ${(excess / 100).toFixed(2).replace(".", ",")}`;
    } else if (percentage >= 80) {
      status = "warning";
      const remaining = budgeted - newSpent;
      message = `⚡ Atenção: você atingirá ${percentage}% do orçamento de ${categoryName}. Restará R$ ${(remaining / 100).toFixed(2).replace(".", ",")}`;
    }

    if (status === "ok") return null;

    return {
      categoryName,
      budgeted,
      currentSpent,
      newSpent,
      percentage,
      status,
      message,
    };
  };

  return { checkBudgetAlert };
}
