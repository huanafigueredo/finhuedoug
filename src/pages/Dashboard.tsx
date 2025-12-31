import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { HeroBalanceCard } from "@/components/dashboard/HeroBalanceCard";
import { CompactMetricCard } from "@/components/dashboard/CompactMetricCard";
import { PersonComparisonCard } from "@/components/dashboard/PersonComparisonCard";
import { RecentTransactionsList } from "@/components/dashboard/RecentTransactionsList";
import { UpcomingBillsList } from "@/components/dashboard/UpcomingBillsList";
import { GamificationWidget } from "@/components/gamification/GamificationWidget";
import { DashboardAvatars } from "@/components/dashboard/DashboardAvatars";
import { PieChart } from "@/components/charts/PieChart";
import { LineChart } from "@/components/charts/LineChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, ArrowUpRight, FileText } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBanks } from "@/hooks/useBanks";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";
import { useContasAVencer } from "@/hooks/useContasAgendadas";
import { useGamification } from "@/hooks/useGamification";
import { useCoupleMembers } from "@/hooks/useCoupleMembers";
import { format, parseISO, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const years = ["2024", "2025", "2026", "2027", "2028", "2029", "2030"];

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

const getMonthValue = (t: any): number => {
  if (t.is_installment && t.installment_value && !t.is_generated_installment) {
    return Number(t.installment_value);
  }
  return Number(t.total_value);
};

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Bom dia", emoji: "☀️" };
  if (hour < 18) return { text: "Boa tarde", emoji: "🌤️" };
  return { text: "Boa noite", emoji: "🌙" };
}

export default function Dashboard() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions();
  const { data: banks = [] } = useBanks();
  const { data: contasAVencer = [] } = useContasAVencer();
  const { data: coupleMembers = [] } = useCoupleMembers();
  const { updateStreak } = useGamification();

  const monthIndex = months.indexOf(selectedMonth);
  const year = parseInt(selectedYear);

  const metrics = useFinancialMetrics(transactions, monthIndex, year);
  const greeting = getGreeting();

  // Update streak when dashboard loads (user is active)
  useEffect(() => {
    updateStreak();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => shouldShowInMonth(t, monthIndex, year));
  }, [transactions, monthIndex, year]);

  const totalSavedInGoals = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.savings_deposit_id)
      .reduce((sum, t) => sum + getMonthValue(t), 0);
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    filteredTransactions
      .filter((t) => t.type === "expense" && t.category && !t.savings_deposit_id)
      .forEach((t) => {
        const cat = t.category || "Outros";
        categoryMap[cat] = (categoryMap[cat] || 0) + getMonthValue(t);
      });

    const colors = [
      "hsl(330, 75%, 55%)",
      "hsl(145, 60%, 42%)",
      "hsl(210, 80%, 55%)",
      "hsl(40, 90%, 55%)",
      "hsl(280, 60%, 55%)",
      "hsl(0, 72%, 55%)",
    ];

    return Object.entries(categoryMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [filteredTransactions]);

  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((t) => {
        const monthValue = getMonthValue(t);
        return {
          id: t.id,
          description: t.description,
          value: t.type === "income" ? monthValue : -monthValue,
          date: format(parseISO(t.date), "dd/MM", { locale: ptBR }),
          isCouple: t.is_couple || false,
        };
      });
  }, [filteredTransactions]);

  const evolutionData = useMemo(() => {
    const result: { name: string; total: number }[] = [];
    const yearNum = parseInt(selectedYear);
    const currentMonthIndex = months.indexOf(selectedMonth);

    for (let i = 5; i >= 0; i--) {
      let monthIdx = currentMonthIndex - i;
      let yearOffset = 0;
      
      if (monthIdx < 0) {
        monthIdx += 12;
        yearOffset = -1;
      }

      const monthTransactions = transactions.filter((t) => 
        shouldShowInMonth(t, monthIdx, yearNum + yearOffset)
      );

      const expenses = monthTransactions
        .filter((t) => t.type === "expense" && !t.savings_deposit_id)
        .reduce((sum, t) => sum + getMonthValue(t), 0);

      result.push({
        name: months[monthIdx].substring(0, 3),
        total: expenses,
      });
    }

    return result;
  }, [transactions, selectedMonth, selectedYear]);

  const hasData = filteredTransactions.length > 0;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {greeting.text}! {greeting.emoji}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Resumo financeiro do casal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/chat-ia">
              <Button variant="outline" size="sm" className="gap-2 text-xs group">
                <Sparkles className="w-4 h-4 group-hover:animate-pulse-soft" />
                Chat IA
              </Button>
            </Link>
            
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-28 sm:w-32 h-9 text-xs">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-20 sm:w-24 h-9 text-xs">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Avatares do casal */}
        {coupleMembers.length > 0 && (
          <div className="mb-6 animate-fade-up" style={{ animationDelay: "50ms" }}>
            <DashboardAvatars members={coupleMembers} />
          </div>
        )}

        {/* Hero Balance Card */}
        <div className="mb-6">
          <HeroBalanceCard
            balance={metrics.totalBalance}
            totalIncome={metrics.totalIncome}
            totalExpenses={metrics.totalExpenses}
            savedInGoals={totalSavedInGoals}
            monthName={selectedMonth}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Compact Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <CompactMetricCard
            emoji="💸"
            label="Total Despesas"
            value={formatCurrency(metrics.totalExpenses)}
            variant="primary"
            delay={100}
          />
          <CompactMetricCard
            emoji="💰"
            label="Total Receitas"
            value={formatCurrency(metrics.totalIncome)}
            variant="success"
            delay={150}
          />
          <CompactMetricCard
            emoji="💕"
            label="Gastos do Casal"
            value={formatCurrency(metrics.coupleExpenses)}
            variant="primary"
            delay={200}
          />
          <CompactMetricCard
            emoji="🎯"
            label="Guardado em Metas"
            value={formatCurrency(totalSavedInGoals)}
            variant="warning"
            delay={250}
          />
        </div>

        {/* Person Comparison + Charts */}
        {hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <PersonComparisonCard
              person1={{
                name: metrics.person1Name,
                expenses: metrics.person1TotalExpenses,
                income: metrics.person1Income,
                balance: metrics.person1Balance,
              }}
              person2={{
                name: metrics.person2Name,
                expenses: metrics.person2TotalExpenses,
                income: metrics.person2Income,
                balance: metrics.person2Balance,
              }}
              formatCurrency={formatCurrency}
              delay={300}
            />
            <div className="animate-fade-up opacity-0" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
              <PieChart data={categoryData} title="Por Categoria" />
            </div>
            <div className="animate-fade-up opacity-0" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
              <LineChart
                data={evolutionData}
                lines={[
                  { dataKey: "total", color: "hsl(330, 75%, 55%)", name: "Total" },
                ]}
                title="Evolução Mensal"
              />
            </div>
          </div>
        ) : (
          <div className="p-8 sm:p-12 rounded-2xl bg-card border border-border/50 shadow-card mb-6 text-center animate-fade-up" style={{ animationDelay: "300ms" }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2">
              Nenhum lançamento encontrado
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comece adicionando suas receitas e despesas.
            </p>
            <Link to="/novo">
              <Button className="gap-2">
                Adicionar lançamento
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <UpcomingBillsList
            contas={contasAVencer}
            formatCurrency={formatCurrency}
            delay={600}
          />
          <RecentTransactionsList
            transactions={recentTransactions}
            formatCurrency={formatCurrency}
            delay={700}
          />
          <div className="md:col-span-2 lg:col-span-1">
            <GamificationWidget />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
