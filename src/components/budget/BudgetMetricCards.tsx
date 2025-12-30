import { MetricCard } from "@/components/shared/MetricCard";
import { BudgetSummary } from "@/hooks/useBudgetProgress";
import { Target, TrendingDown, Wallet, AlertTriangle } from "lucide-react";

interface BudgetMetricCardsProps {
  summary: BudgetSummary;
}

const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
};

export function BudgetMetricCards({ summary }: BudgetMetricCardsProps) {
  const { totalBudgeted, totalSpent, totalRemaining, budgetProgress } = summary;
  
  const categoriesInAlert = budgetProgress.filter(
    (item) => item.status === "warning" || item.status === "exceeded"
  ).length;
  
  const exceededCount = budgetProgress.filter(
    (item) => item.status === "exceeded"
  ).length;

  const percentUsed = totalBudgeted > 0 
    ? Math.round((totalSpent / totalBudgeted) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <MetricCard
        title="Orçamento Total"
        value={formatCurrency(totalBudgeted)}
        emoji="🎯"
        variant="primary"
        delay={0}
      />
      
      <MetricCard
        title="Gasto Atual"
        value={formatCurrency(totalSpent)}
        subtitle={`${percentUsed}% utilizado`}
        emoji="💸"
        variant={percentUsed >= 100 ? "warning" : "default"}
        delay={100}
      />
      
      <MetricCard
        title={totalRemaining >= 0 ? "Saldo Restante" : "Excesso"}
        value={formatCurrency(Math.abs(totalRemaining))}
        emoji={totalRemaining >= 0 ? "💰" : "🔥"}
        variant={totalRemaining >= 0 ? "success" : "warning"}
        delay={200}
      />
      
      <MetricCard
        title="Em Alerta"
        value={categoriesInAlert.toString()}
        subtitle={exceededCount > 0 ? `${exceededCount} ultrapassado(s)` : "categorias"}
        emoji={categoriesInAlert > 0 ? "⚠️" : "✅"}
        variant={exceededCount > 0 ? "warning" : categoriesInAlert > 0 ? "info" : "success"}
        delay={300}
      />
    </div>
  );
}
