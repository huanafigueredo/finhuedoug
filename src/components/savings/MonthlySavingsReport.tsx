import { useMemo } from "react";
import { Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { usePersonNames } from "@/hooks/useUserSettings";
import { parseISO, differenceInMonths } from "date-fns";
import { GoalOwnerFilter } from "@/hooks/useSavingsGoals";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Helper to get month value from transaction
const getMonthValue = (t: any): number => {
  if (t.is_installment && t.installment_value && !t.is_generated_installment) {
    return Number(t.installment_value);
  }
  return Number(t.total_value);
};

// Helper function for installment projection
function calculateInstallmentForMonth(
  firstInstallmentDate: Date,
  startInstallment: number,
  totalInstallments: number,
  filterMonth: number,
  filterYear: number
): { currentInstallment: number; isInRange: boolean } | null {
  const firstMonth = firstInstallmentDate.getMonth() + 1;
  const firstYear = firstInstallmentDate.getFullYear();
  
  const filterDate = new Date(filterYear, filterMonth - 1, 1);
  const firstDate = new Date(firstYear, firstMonth - 1, 1);
  const monthsDiff = differenceInMonths(filterDate, firstDate);
  
  const currentInstallment = startInstallment + monthsDiff;
  const isInRange = currentInstallment >= startInstallment && currentInstallment <= totalInstallments;
  
  return { currentInstallment, isInRange };
}

// Check if transaction should appear in the filtered month
function shouldShowInMonth(t: any, filterMonth: number, filterYear: number): boolean {
  const rawDate = parseISO(t.date);
  const isNewStyleInstallment = t.is_installment && t.total_installments && !t.is_generated_installment;
  
  if (isNewStyleInstallment) {
    const startInstallment = t.installment_number || 1;
    const result = calculateInstallmentForMonth(
      rawDate,
      startInstallment,
      t.total_installments,
      filterMonth + 1,
      filterYear
    );
    return result?.isInRange ?? false;
  }
  
  return rawDate.getMonth() === filterMonth && rawDate.getFullYear() === filterYear;
}

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

    // Calculate value based on owner filter
    const getValueForOwner = (t: any, baseValue: number) => {
      if (!ownerFilter || ownerFilter === "all" || ownerFilter === "couple") {
        return baseValue;
      }
      
      // For individual: if it's a couple expense, take half
      if (t.is_couple === true) {
        return baseValue / 2;
      }
      
      return baseValue;
    };

    // Total saved in goals (transactions with savings_deposit_id)
    let savedInGoals = 0;
    monthTransactions
      .filter((t) => isSavingsTransfer(t) && filterByOwner(t, "expense"))
      .forEach((t) => {
        savedInGoals += getValueForOwner(t, getMonthValue(t));
      });

    // Real expenses (excluding savings deposits)
    let realExpenses = 0;
    monthTransactions
      .filter((t) => t.type === "expense" && !isSavingsTransfer(t) && filterByOwner(t, "expense"))
      .forEach((t) => {
        realExpenses += getValueForOwner(t, getMonthValue(t));
      });

    // Total income
    let totalIncome = 0;
    monthTransactions
      .filter((t) => t.type === "income" && filterByOwner(t, "income"))
      .forEach((t) => {
        totalIncome += getValueForOwner(t, getMonthValue(t));
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
  }, [transactions, month, year, ownerFilter, person1, person2]);

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
