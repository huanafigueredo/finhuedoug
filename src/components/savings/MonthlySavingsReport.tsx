import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingDown, TrendingUp, PiggyBank } from "lucide-react";
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
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
              <PiggyBank className="w-4 h-4 text-info" />
            </div>
            Relatório Mensal de Economia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Sem dados para o período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-info/15 flex items-center justify-center">
            <PiggyBank className="w-4 h-4 text-info" />
          </div>
          Relatório Mensal de Economia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comparativo visual */}
        <div className="grid grid-cols-2 gap-4">
          {/* Guardado em Metas */}
          <div className="p-4 rounded-xl bg-info/10 border border-info/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-info" />
              <span className="text-xs font-medium text-muted-foreground">Guardado em Metas</span>
            </div>
            <p className="text-xl font-bold text-info">
              {formatCurrency(reportData.savedInGoals)}
            </p>
            {reportData.totalIncome > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {reportData.savingsRate.toFixed(1)}% da receita
              </p>
            )}
          </div>

          {/* Gastos Reais */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Gastos Reais</span>
            </div>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(reportData.realExpenses)}
            </p>
            {reportData.totalIncome > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {reportData.expenseRate.toFixed(1)}% da receita
              </p>
            )}
          </div>
        </div>

        {/* Barra de proporção */}
        {reportData.totalIncome > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Distribuição da Receita</span>
              <span>{formatCurrency(reportData.totalIncome)}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden flex">
              {/* Guardado */}
              <div 
                className="h-full bg-info transition-all duration-500"
                style={{ width: `${reportData.savingsRate}%` }}
              />
              {/* Gastos */}
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${reportData.expenseRate}%` }}
              />
              {/* Sobra */}
              <div 
                className="h-full bg-success transition-all duration-500"
                style={{ width: `${Math.max(0, 100 - reportData.savingsRate - reportData.expenseRate)}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-info" />
                Metas ({reportData.savingsRate.toFixed(0)}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Gastos ({reportData.expenseRate.toFixed(0)}%)
              </span>
              {reportData.balance > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Sobra ({(100 - reportData.savingsRate - reportData.expenseRate).toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Receita Total</span>
            </div>
            <span className="text-sm font-semibold text-success">
              {formatCurrency(reportData.totalIncome)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">Saldo após gastos e metas</span>
            <span className={cn(
              "text-sm font-semibold",
              reportData.balance >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(reportData.balance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
