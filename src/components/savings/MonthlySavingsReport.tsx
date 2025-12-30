import { useMemo } from "react";
import { Target, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { parseISO, differenceInMonths } from "date-fns";

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
  className?: string;
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  variant: "info" | "primary" | "success" | "neutral";
}

function MetricItem({ icon, label, value, subtext, variant }: MetricItemProps) {
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
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm",
      variantStyles[variant]
    )}>
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

export function MonthlySavingsReport({ month, year, className }: MonthlySavingsReportProps) {
  const { data: transactions = [] } = useTransactions();

  const reportData = useMemo(() => {
    // Filter transactions for the selected month
    const monthTransactions = transactions.filter((t) => shouldShowInMonth(t, month, year));

    // Total saved in goals (transactions with savings_deposit_id)
    const savedInGoals = monthTransactions
      .filter((t) => t.savings_deposit_id)
      .reduce((sum, t) => sum + getMonthValue(t), 0);

    // Real expenses (excluding savings deposits)
    const realExpenses = monthTransactions
      .filter((t) => t.type === "expense" && !t.savings_deposit_id)
      .reduce((sum, t) => sum + getMonthValue(t), 0);

    // Total income
    const totalIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + getMonthValue(t), 0);

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
  }, [transactions, month, year]);

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
        />
        <MetricItem
          icon={<TrendingDown className="w-4 h-4" />}
          label="Gastos Reais"
          value={formatCurrency(reportData.realExpenses)}
          subtext={reportData.totalIncome > 0 ? `${reportData.expenseRate.toFixed(0)}% da receita` : undefined}
          variant="primary"
        />
        <MetricItem
          icon={<TrendingUp className="w-4 h-4" />}
          label="Receita Total"
          value={formatCurrency(reportData.totalIncome)}
          variant="success"
        />
        <MetricItem
          icon={<Wallet className="w-4 h-4" />}
          label="Saldo Livre"
          value={formatCurrency(reportData.balance)}
          variant={reportData.balance >= 0 ? "success" : "primary"}
        />
      </div>

      {/* Proportion Bar - Compact */}
      {reportData.totalIncome > 0 && (
        <div className="space-y-1.5">
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
