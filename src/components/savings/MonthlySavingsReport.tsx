import { useMemo } from "react";
import { Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { usePersonNames } from "@/hooks/useUserSettings";
import { useSplitCalculation } from "@/hooks/useSplitCalculation";
import { GoalOwnerFilter } from "@/hooks/useSavingsGoals";
import { shouldShowInMonth, getTransactionMonthValue } from "@/lib/transactionUtils";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface MonthlySavingsReportProps {
  month: number; // 0-indexed
  year: number;
  ownerFilter?: GoalOwnerFilter;
  className?: string;
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  variant: "info" | "primary" | "success" | "neutral";
  delay?: number;
}

function MetricItem({ icon, label, value, subtext, variant, delay = 0 }: MetricItemProps) {
  const variantStyles = {
    info: "bg-info/10 text-info border-info/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    neutral: "bg-muted text-foreground border-border",
  };

  const iconBg = {
    info: "bg-info/15 text-info",
    primary: "bg-primary/15 text-primary",
    success: "bg-success/15 text-success",
    neutral: "bg-muted text-muted-foreground",
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm animate-fade-up",
        variantStyles[variant]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", iconBg[variant])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-base font-semibold truncate">{value}</p>
        {subtext && <p className="text-[10px] text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

export function MonthlySavingsReport({ month, year, ownerFilter, className }: MonthlySavingsReportProps) {
  const { data: transactions = [] } = useTransactions();
  const { person1, person2 } = usePersonNames();
  const { calculateSplitForTransaction } = useSplitCalculation();

  const reportData = useMemo(() => {
    // Filter transactions for the selected month
    const monthTransactions = transactions.filter((t) => shouldShowInMonth(t, month, year));

    // Helper to check if transaction is a savings goal deposit
    const isSavingsTransfer = (t: any) => !!t.savings_deposit_id;

    // Filter by owner
    const filterByOwner = (t: any, type: "expense" | "income") => {
      if (!ownerFilter || ownerFilter === "all") return true;
      
      if (ownerFilter === "couple") {
        // For couple: only couple expenses/income
        return t.is_couple === true || t.for_who === "Casal";
      }
      
      const personName = ownerFilter === "person1" ? person1 : person2;
      
      if (type === "expense") {
        // Individual expenses for this person + half of couple expenses
        return t.for_who === personName || t.is_couple === true;
      }
      
      // Income: only for this specific person
      return t.for_who === personName;
    };

    // Calculate value based on owner filter using split rules
    const getValueForOwner = (t: any, baseValue: number) => {
      if (!ownerFilter || ownerFilter === "all" || ownerFilter === "couple") {
        return baseValue;
      }
      
      // For individual: if it's a couple expense, use split calculation
      if (t.is_couple === true) {
        const split = calculateSplitForTransaction(
          baseValue, 
          t.category, 
          t.subcategory,
          t.custom_person1_percentage,
          t.custom_person2_percentage
        );
        return ownerFilter === "person1" ? split.person1 : split.person2;
      }
      
      return baseValue;
    };

    // Total saved in goals (transactions with savings_deposit_id)
    let savedInGoals = 0;
    monthTransactions
      .filter((t) => isSavingsTransfer(t) && filterByOwner(t, "expense"))
      .forEach((t) => {
        savedInGoals += getValueForOwner(t, getTransactionMonthValue(t));
      });

    // Real expenses (excluding savings deposits)
    let realExpenses = 0;
    monthTransactions
      .filter((t) => t.type === "expense" && !isSavingsTransfer(t) && filterByOwner(t, "expense"))
      .forEach((t) => {
        realExpenses += getValueForOwner(t, getTransactionMonthValue(t));
      });

    // Total income
    let totalIncome = 0;
    monthTransactions
      .filter((t) => t.type === "income" && filterByOwner(t, "income"))
      .forEach((t) => {
        totalIncome += getValueForOwner(t, getTransactionMonthValue(t));
      });

    // Savings rate (percentage of income saved)
    const savingsRate = totalIncome > 0 ? (savedInGoals / totalIncome) * 100 : 0;

    // Expense rate (percentage of income spent)
    const expenseRate = totalIncome > 0 ? (realExpenses / totalIncome) * 100 : 0;

    return {
      savedInGoals,
      realExpenses,
      totalIncome,
      savingsRate,
      expenseRate,
      balance: totalIncome - realExpenses - savedInGoals,
    };
  }, [transactions, month, year, ownerFilter, person1, person2, calculateSplitForTransaction]);

  const hasData = reportData.totalIncome > 0 || reportData.realExpenses > 0 || reportData.savedInGoals > 0;

  if (!hasData) {
    return (
      <div className={cn("text-center py-6 text-muted-foreground text-sm", className)}>
        Sem dados para o período selecionado
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Metrics Grid - Horizontal on desktop, 2x2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricItem
          icon={<Target className="w-4 h-4" />}
          label="Guardado em Metas"
          value={formatCurrency(reportData.savedInGoals)}
          subtext={reportData.totalIncome > 0 ? `${reportData.savingsRate.toFixed(0)}% da receita` : undefined}
          variant="info"
          delay={0}
        />
        <MetricItem
          icon={<TrendingDown className="w-4 h-4" />}
          label="Gastos Reais"
          value={formatCurrency(reportData.realExpenses)}
          subtext={reportData.totalIncome > 0 ? `${reportData.expenseRate.toFixed(0)}% da receita` : undefined}
          variant="primary"
          delay={50}
        />
        <MetricItem
          icon={<TrendingUp className="w-4 h-4" />}
          label="Receita Total"
          value={formatCurrency(reportData.totalIncome)}
          variant="success"
          delay={100}
        />
        <MetricItem
          icon={<Wallet className="w-4 h-4" />}
          label="Saldo Livre"
          value={formatCurrency(reportData.balance)}
          variant={reportData.balance >= 0 ? "success" : "primary"}
          delay={150}
        />
      </div>

      {/* Proportion Bar - Compact */}
      {reportData.totalIncome > 0 && (
        <div className="space-y-1.5 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
            <div 
              className="h-full bg-info transition-all duration-500"
              style={{ width: `${reportData.savingsRate}%` }}
            />
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${reportData.expenseRate}%` }}
            />
            <div 
              className="h-full bg-success transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - reportData.savingsRate - reportData.expenseRate)}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-info" />
              Metas {reportData.savingsRate.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Gastos {reportData.expenseRate.toFixed(0)}%
            </span>
            {reportData.balance > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Livre {(100 - reportData.savingsRate - reportData.expenseRate).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
